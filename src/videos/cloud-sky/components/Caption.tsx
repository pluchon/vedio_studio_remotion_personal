// 本片的字幕：通用手写式字幕，绑定霞鹜文楷与斜体衬线
import React from "react";
import { Caption as BaseCaption } from "../../../shared/Caption";
import { FONTS } from "../theme";

export const Caption: React.FC<Omit<React.ComponentProps<typeof BaseCaption>, "font" | "enFont">> = (props) => (
  <BaseCaption font={FONTS.hand} enFont={FONTS.latin} {...props} />
);
