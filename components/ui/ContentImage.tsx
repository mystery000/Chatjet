import Image from 'next/image';

export const ContentImage = ({ src, alt, title, ...props }: any) => {
  const [width, height] = src
    .split('/')
    .slice(-1)[0]
    .split('-')[0]
    .slice(1)
    .split('x');
  return (
    <Image
      className="rounded"
      alt={alt}
      src={src}
      width={width}
      height={height}
      title={title}
      {...props}
    />
  );
};
