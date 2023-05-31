import { FC, ReactNode } from 'react';

type MDXComponentProps = {
  children: ReactNode;
};

export const MDXComponent: FC<MDXComponentProps> = ({ children }) => {
  return (
    <div className="prose prose-invert mx-auto max-w-screen-md p-8">
      {children}
    </div>
  );
};
