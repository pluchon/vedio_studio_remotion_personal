// 本片的拍立得：题注用霞鹜文楷
import React from "react";
import { Polaroid as BasePolaroid } from "../../../shared/Polaroid";
import { FONTS } from "../theme";

export const Polaroid: React.FC<Omit<React.ComponentProps<typeof BasePolaroid>, "font">> = (props) => (
  <BasePolaroid font={FONTS.hand} {...props} />
);
