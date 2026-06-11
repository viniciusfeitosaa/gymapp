import { useEffect } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  children: React.ReactNode;
};

/** Renderiza modais no body — evita clipping do layout nativo (overflow hidden). */
export function ModalPortal({ children }: Props) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}
