/**
 * Renders the profile's background: solid / gradient / image / gif / video,
 * with optional blur + dark overlay. Always sits behind content.
 */
export const ProfileBackground = ({ background = {}, className = '' }) => {
  const { type, color, gradient, image, video, blur = 0, overlay = 0 } = background;

  return (
    <div className={`absolute inset-0 -z-10 overflow-hidden ${className}`} aria-hidden="true">
      <div className="absolute inset-0" style={{ filter: blur ? `blur(${blur}px)` : undefined, transform: blur ? 'scale(1.06)' : undefined }}>
        {type === 'solid' && <div className="h-full w-full" style={{ background: `hsl(${color})` }} />}
        {type === 'gradient' && <div className="h-full w-full" style={{ background: gradient || `hsl(${color})` }} />}
        {(type === 'image' || type === 'gif') && image && (
          <img src={image} alt="" className="h-full w-full object-cover" />
        )}
        {type === 'video' && (
          video ? (
            <video src={video} autoPlay muted loop playsInline className="h-full w-full object-cover" />
          ) : image ? (
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full" style={{ background: `hsl(${color})` }} />
          )
        )}
        {((type === 'image' || type === 'gif' || type === 'video') && !image && !video) && (
          <div className="h-full w-full" style={{ background: `hsl(${color})` }} />
        )}
      </div>
      {overlay > 0 && <div className="absolute inset-0 bg-black" style={{ opacity: overlay / 100 }} />}
    </div>
  );
};
