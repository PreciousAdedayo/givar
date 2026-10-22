/* eslint-disable @next/next/no-img-element */
export default function Avatar({ name, image, size = 40 }: { name?: string | null; image?: string | null; size?: number }) {
  const ini = (name ?? "").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "G";
  const style = { width: size, height: size, fontSize: size * 0.38 };
  const initialsStyle = { ...style, color: "#D8F24A" }; // fixed lime: the avatar is always dark, even in light mode
  return image
    ? <img src={image} alt="" referrerPolicy="no-referrer" style={style} className="shrink-0 rounded-full object-cover" />
    : <span style={initialsStyle} className="grad-dark grid shrink-0 place-items-center rounded-full font-semibold" aria-hidden>{ini}</span>;
}
