// WebGL2 单画布引擎：每个镜头是一个片元着色器，画进半精度 HDR 缓冲；镜头之间按透明度叠化，
// 然后泛光、曝光、ACES 色调映射、调色、暗角、颗粒，最后放进 2.4:1 的画幅里
import { POST_FRAG, BLIT_FRAG, DOWN_FRAG, UP_FRAG, VERT } from "./post";
import { LIB } from "./lib";

export type UVal = number | readonly number[];
export type Uniforms = Record<string, UVal>;

export type ProgramDef = { frag: string; scale?: number };

export type Layer = {
  prog: string;
  alpha: number;
  u: Uniforms;
  // 镜头自己用 Canvas 2D 画的东西（线、点、星图），作为 uCanvas 传进着色器
  canvas?: HTMLCanvasElement;
};

export type Post = {
  exposure: number;
  bloom: number; // 泛光强度
  threshold: number; // 泛光阈值（线性亮度）
  grain: number;
  vignette: number;
  sat: number; // 饱和度
  tint: readonly [number, number, number]; // 乘到最后的颜色上
  lift: number; // 暗部抬一点（褪色的旧照片感）
  ca: number; // 边缘色差
  fade: number; // 整体乘到黑（1 是不变）
  raw: number; // 1 = 不做色调映射（真实照片按原样显示）
};

export const DEFAULT_POST: Post = {
  exposure: 1,
  bloom: 0.55,
  threshold: 0.9,
  grain: 0.035,
  vignette: 0.35,
  sat: 1,
  tint: [1, 1, 1],
  lift: 0,
  ca: 0.3,
  fade: 1,
  raw: 0,
};

type Info = { loc: WebGLUniformLocation; type: number; size: number };
type Prog = { p: WebGLProgram; u: Map<string, Info> };
type Target = { fb: WebGLFramebuffer; tex: WebGLTexture; w: number; h: number };

const NOISE = 256;
const BUILTIN = new Set(["uNoise", "uCanvas", "uImage", "uRes", "uTime", "uFrame"]);

export class Engine {
  gl: WebGL2RenderingContext;
  defs: Record<string, ProgramDef>;
  progs = new Map<string, Prog>();
  targets = new Map<string, Target>();
  noise: WebGLTexture;
  canvasTex: WebGLTexture;
  images = new Map<string, WebGLTexture>();
  W: number;
  H: number;
  vao: WebGLVertexArrayObject;
  frame = 0;

  constructor(
    canvas: HTMLCanvasElement,
    defs: Record<string, ProgramDef>,
    private pic: { w: number; h: number; y: number },
  ) {
    const gl = canvas.getContext("webgl2", {
      preserveDrawingBuffer: true,
      antialias: false,
      alpha: false,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("没有 WebGL2");
    if (!gl.getExtension("EXT_color_buffer_float")) throw new Error("没有 EXT_color_buffer_float，HDR 缓冲画不了");
    this.gl = gl;
    this.defs = defs;
    this.W = pic.w;
    this.H = pic.h;
    this.vao = gl.createVertexArray()!;
    this.noise = this.makeNoise();
    this.canvasTex = this.makeTex(1, 1, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  }

  // 噪声贴图：R 是随机值，G 是 R 错开 (37, 17) 个像素——三维值噪声只要一次采样（iq 的做法）
  private makeNoise() {
    const gl = this.gl;
    const data = new Uint8Array(NOISE * NOISE * 4);
    let s = 1234567;
    const rnd = () => {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      return (s >>> 0) / 4294967296;
    };
    const r = new Uint8Array(NOISE * NOISE);
    const b = new Uint8Array(NOISE * NOISE);
    const a = new Uint8Array(NOISE * NOISE);
    for (let i = 0; i < r.length; i++) {
      r[i] = Math.floor(rnd() * 256);
      b[i] = Math.floor(rnd() * 256);
      a[i] = Math.floor(rnd() * 256);
    }
    for (let y = 0; y < NOISE; y++) {
      for (let x = 0; x < NOISE; x++) {
        const i = y * NOISE + x;
        const j = ((y - 17 + NOISE) % NOISE) * NOISE + ((x - 37 + NOISE) % NOISE);
        data[i * 4] = r[i];
        data[i * 4 + 1] = r[j];
        data[i * 4 + 2] = b[i];
        data[i * 4 + 3] = a[i];
      }
    }
    const tex = this.makeTex(NOISE, NOISE, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    return tex;
  }

  private makeTex(w: number, h: number, internal: number, format: number, type: number, data: ArrayBufferView | null) {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  async loadImage(name: string, url: string) {
    const img = new Image();
    img.src = url;
    await img.decode();
    const gl = this.gl;
    const tex = this.makeTex(1, 1, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    this.images.set(name, tex);
  }

  private target(name: string, w: number, h: number): Target {
    const key = `${name}:${w}x${h}`;
    const hit = this.targets.get(key);
    if (hit) return hit;
    const gl = this.gl;
    const tex = this.makeTex(w, h, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, null);
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const t = { fb, tex, w, h };
    this.targets.set(key, t);
    return t;
  }

  // 开始编译（不等结果）；ANGLE 有 KHR_parallel_shader_compile 时会在后台线程并行编
  private begin(name: string, frag: string) {
    const gl = this.gl;
    const sh = (type: number, src: string) => {
      const x = gl.createShader(type)!;
      gl.shaderSource(x, src);
      gl.compileShader(x);
      return x;
    };
    const vs = sh(gl.VERTEX_SHADER, VERT);
    const fs = sh(gl.FRAGMENT_SHADER, frag);
    const p = gl.createProgram()!;
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    return { p, vs, fs, frag };
  }

  // 编译完：检查错误，记下所有 uniform 的位置
  private finish(name: string, b: { p: WebGLProgram; vs: WebGLShader; fs: WebGLShader; frag: string }): Prog {
    const gl = this.gl;
    for (const [x, src] of [
      [b.vs, VERT],
      [b.fs, b.frag],
    ] as const) {
      if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(x);
        const lines = src.split("\n").map((l, i) => `${i + 1}: ${l}`);
        const m = /0:(\d+)/.exec(log ?? "");
        const at = m ? Number(m[1]) : 0;
        throw new Error(`着色器 ${name} 编译失败：${log}\n${lines.slice(Math.max(0, at - 4), at + 2).join("\n")}`);
      }
    }
    if (!gl.getProgramParameter(b.p, gl.LINK_STATUS)) throw new Error(`着色器 ${name} 链接失败：${gl.getProgramInfoLog(b.p)}`);
    const u = new Map<string, Info>();
    const n = gl.getProgramParameter(b.p, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(b.p, i)!;
      const key = info.name.replace(/\[0\]$/, "");
      u.set(key, { loc: gl.getUniformLocation(b.p, info.name)!, type: info.type, size: info.size });
    }
    const prog = { p: b.p, u };
    this.progs.set(name, prog);
    return prog;
  }

  private compile(name: string, frag: string): Prog {
    return this.progs.get(name) ?? this.finish(name, this.begin(name, frag));
  }

  private sceneSource(name: string) {
    const def = this.defs[name];
    if (!def) throw new Error(`没有这个场景着色器：${name}`);
    return `#version 300 es\nprecision highp float;\nprecision highp int;\n${LIB}\n${def.frag}`;
  }

  private sceneProgram(name: string) {
    return this.compile(name, this.sceneSource(name));
  }

  // 预先把所有场景着色器一起编好（有 KHR_parallel_shader_compile 时并行），免得某一帧里现编超过单帧的时限
  async warm(names: string[]) {
    const gl = this.gl;
    const par = gl.getExtension("KHR_parallel_shader_compile");
    const pending = names.filter((n) => !this.progs.has(n)).map((n) => [n, this.begin(n, this.sceneSource(n))] as const);
    if (par) {
      const COMPLETION = 0x91b1;
      while (pending.some(([, b]) => !gl.getProgramParameter(b.p, COMPLETION))) {
        await new Promise((r) => setTimeout(r, 50));
      }
    }
    for (const [n, b] of pending) this.finish(n, b);
  }

  private set(prog: Prog, name: string, v: UVal) {
    const info = prog.u.get(name);
    if (!info) return;
    const gl = this.gl;
    const arr = typeof v === "number" ? [v] : v;
    switch (info.type) {
      case gl.FLOAT:
        if (info.size > 1) gl.uniform1fv(info.loc, arr as number[]);
        else gl.uniform1f(info.loc, arr[0]);
        break;
      case gl.FLOAT_VEC2:
        gl.uniform2fv(info.loc, arr as number[]);
        break;
      case gl.FLOAT_VEC3:
        gl.uniform3fv(info.loc, arr as number[]);
        break;
      case gl.FLOAT_VEC4:
        gl.uniform4fv(info.loc, arr as number[]);
        break;
      case gl.INT:
      case gl.SAMPLER_2D:
        gl.uniform1i(info.loc, arr[0]);
        break;
      case gl.FLOAT_MAT3:
        gl.uniformMatrix3fv(info.loc, false, arr as number[]);
        break;
      default:
        break;
    }
  }

  private width(type: number) {
    const gl = this.gl;
    if (type === gl.FLOAT_VEC2) return 2;
    if (type === gl.FLOAT_VEC3) return 3;
    if (type === gl.FLOAT_VEC4) return 4;
    if (type === gl.FLOAT_MAT3) return 9;
    return 1;
  }

  private bindTex(unit: number, tex: WebGLTexture) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
  }

  private quad() {
    this.gl.bindVertexArray(this.vao);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
  }

  private drawScene(layer: Layer, target: Target, t: number) {
    const gl = this.gl;
    const prog = this.sceneProgram(layer.prog);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb);
    gl.viewport(0, 0, target.w, target.h);
    gl.useProgram(prog.p);
    this.bindTex(0, this.noise);
    this.set(prog, "uNoise", 0);
    if (layer.canvas) {
      this.bindTex(1, this.canvasTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, layer.canvas);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      this.set(prog, "uCanvas", 1);
    }
    const img = this.images.get("hudf");
    if (img) {
      this.bindTex(2, img);
      this.set(prog, "uImage", 2);
    }
    this.set(prog, "uRes", [target.w, target.h]);
    this.set(prog, "uTime", t);
    this.set(prog, "uFrame", this.frame);
    // 同一个着色器被好几个镜头用：这个镜头没给的 uniform 清零，免得沿用上一个镜头的值
    for (const [k, info] of prog.u) {
      if (k in layer.u || BUILTIN.has(k)) continue;
      this.set(prog, k, new Array(Math.max(1, info.size) * 16).fill(0).slice(0, this.width(info.type) * info.size));
    }
    for (const [k, v] of Object.entries(layer.u)) this.set(prog, k, v);
    this.quad();
  }

  render(t: number, frame: number, layers: Layer[], post: Post) {
    const gl = this.gl;
    this.frame = frame;
    const { W, H } = this;
    const hdr = this.target("hdr", W, H);
    gl.disable(gl.BLEND);
    const visible = layers.filter((l) => l.alpha > 0.0005);
    if (visible.length === 1 && (this.defs[visible[0].prog].scale ?? 1) === 1 && visible[0].alpha >= 0.9995) {
      this.drawScene(visible[0], hdr, t);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, hdr.fb);
      gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      visible.forEach((layer, i) => {
        const s = this.defs[layer.prog].scale ?? 1;
        const tgt = this.target(`layer${i}`, Math.round(W * s), Math.round(H * s));
        gl.disable(gl.BLEND);
        this.drawScene(layer, tgt, t);
        // 叠到 HDR 上：常数透明度混合
        gl.bindFramebuffer(gl.FRAMEBUFFER, hdr.fb);
        gl.viewport(0, 0, W, H);
        gl.enable(gl.BLEND);
        gl.blendColor(0, 0, 0, layer.alpha);
        gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA);
        const blit = this.compile("blit", BLIT_FRAG);
        gl.useProgram(blit.p);
        this.bindTex(0, tgt.tex);
        this.set(blit, "uSrc", 0);
        this.set(blit, "uRes", [W, H]);
        this.quad();
      });
      gl.disable(gl.BLEND);
    }

    // 泛光：逐级缩小（第一级带软阈值），再逐级放大叠回去
    const levels: Target[] = [];
    let w = W;
    let h = H;
    for (let i = 0; i < 6; i++) {
      w = Math.max(1, Math.floor(w / 2));
      h = Math.max(1, Math.floor(h / 2));
      levels.push(this.target(`bloom${i}`, w, h));
    }
    const down = this.compile("down", DOWN_FRAG);
    gl.useProgram(down.p);
    let src = hdr;
    levels.forEach((dst, i) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb);
      gl.viewport(0, 0, dst.w, dst.h);
      this.bindTex(0, src.tex);
      this.set(down, "uSrc", 0);
      this.set(down, "uTexel", [1 / src.w, 1 / src.h]);
      this.set(down, "uRes", [dst.w, dst.h]);
      this.set(down, "uFirst", i === 0 ? 1 : 0);
      this.set(down, "uThreshold", post.threshold);
      this.quad();
      src = dst;
    });
    const up = this.compile("up", UP_FRAG);
    gl.useProgram(up.p);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    for (let i = levels.length - 1; i > 0; i--) {
      const s = levels[i];
      const d = levels[i - 1];
      gl.bindFramebuffer(gl.FRAMEBUFFER, d.fb);
      gl.viewport(0, 0, d.w, d.h);
      this.bindTex(0, s.tex);
      this.set(up, "uSrc", 0);
      this.set(up, "uTexel", [1 / s.w, 1 / s.h]);
      this.set(up, "uRes", [d.w, d.h]);
      this.quad();
    }
    gl.disable(gl.BLEND);

    // 成片：画幅以外是黑边
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, this.pic.y, W, H);
    const fin = this.compile("post", POST_FRAG);
    gl.useProgram(fin.p);
    this.bindTex(0, hdr.tex);
    this.bindTex(1, levels[0].tex);
    this.set(fin, "uHdr", 0);
    this.set(fin, "uBloom", 1);
    this.set(fin, "uRes", [W, H]);
    this.set(fin, "uOrigin", [0, this.pic.y]);
    this.set(fin, "uFrame", frame);
    this.set(fin, "uExposure", post.exposure);
    this.set(fin, "uBloomAmt", post.bloom);
    this.set(fin, "uGrain", post.grain);
    this.set(fin, "uVig", post.vignette);
    this.set(fin, "uSat", post.sat);
    this.set(fin, "uTint", post.tint);
    this.set(fin, "uLift", post.lift);
    this.set(fin, "uCA", post.ca);
    this.set(fin, "uFade", post.fade);
    this.set(fin, "uRaw", post.raw);
    this.quad();
  }
}
