import { StampRow } from "globals";
import { mimeTypesArray } from "utils/util.ts";

export const Stamp = (
  { stamp, className }: { stamp: StampRow; className: string },
) => {
  const getStampSrc = () => {
    if (!stamp.stamp_url) return "/content/not-available.png";

    const urlParts = stamp.stamp_url.split("/");
    const filenameParts = urlParts[urlParts.length - 1].split(".");
    const txHash = filenameParts[0];
    const suffix = filenameParts[1];

    if (!mimeTypesArray.includes(stamp.stamp_mimetype || "")) {
      return "/content/not-available.png";
    }

    return `/content/${txHash}.${suffix}`;
  };

  const src = getStampSrc();

  if (stamp.stamp_mimetype === "text/html") {
    return (
      <iframe
        width="100%"
        height="100%"
        scrolling="no"
        className={`${className} aspect-square rounded-lg`}
        sandbox="allow-scripts allow-same-origin"
        src={src}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src = stamp.stamp_url;
        }}
        title="Stamp"
      />
    );
  }

  return (
    <img
      width="100%"
      loading="lazy"
      className={`max-w-none object-contain image-rendering-pixelated rounded-lg ${className}`}
      src={src}
      onError={(e) => {
        e.currentTarget.src = "/content/not-available.png";
      }}
      alt="Stamp"
    />
  );
};

export default Stamp;
