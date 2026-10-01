// 后期：整幅画面先画进高动态范围的缓冲；赶路时沿径向拉出一点拖影；亮过阈值的部分溢出一圈辉光；再输出。
// 放在画布里的最后
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

// 镜头后退时，一帧之内画面朝中心缩了多少，就沿着这段路取样平均：等于快门开着时拍到的拖影
const ZOOM_BLUR = {
  uniforms: { tDiffuse: { value: null }, amount: { value: 0 } },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float amount;
    varying vec2 vUv;
    void main() {
      vec2 fromCenter = vUv - 0.5;
      vec4 sum = vec4(0.0);
      for (int i = 0; i < 20; i++) {
        float k = (float(i) / 19.0 - 0.5) * amount;
        sum += texture2D(tDiffuse, 0.5 + fromCenter * (1.0 + k));
      }
      gl_FragColor = sum / 20.0;
    }
  `,
};

export const Post: React.FC<{ strength?: number; radius?: number; threshold?: number; zoomBlur?: number }> = ({
  strength = 0.9,
  radius = 0.6,
  threshold = 0.85,
  zoomBlur = 0,
}) => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  const { composer, bloom, blur } = useMemo(() => {
    const composer = new EffectComposer(gl);
    composer.addPass(new RenderPass(scene, camera));
    const blur = new ShaderPass(ZOOM_BLUR);
    composer.addPass(blur);
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 1, 1, 1);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    return { composer, bloom, blur };
  }, [gl, scene, camera]);

  useEffect(() => {
    composer.setPixelRatio(gl.getPixelRatio());
    composer.setSize(size.width, size.height);
  }, [composer, gl, size.width, size.height]);

  useEffect(() => () => composer.dispose(), [composer]);

  // 优先级大于 0：由这里出图，画布不再自己画一遍
  useFrame(() => {
    // 不做色调映射：暗部原样输出，开头片段和它贴在地上的最后一帧才能严丝合缝
    gl.toneMapping = THREE.NoToneMapping;
    bloom.strength = strength;
    bloom.radius = radius;
    bloom.threshold = threshold;
    blur.enabled = zoomBlur > 0.0005;
    blur.uniforms.amount.value = zoomBlur;
    composer.render();
  }, 1);

  return null;
};
