import type { Variants } from 'framer-motion';
import { duration, easing } from './constants';

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.normal } },
  exit: { opacity: 0, transition: { duration: duration.fast } },
};

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.moderate, ease: easing.enter } },
  exit: { opacity: 0, y: 10, transition: { duration: duration.normal, ease: easing.exit } },
};

export const slideDownVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.moderate, ease: easing.enter } },
  exit: { opacity: 0, y: -10, transition: { duration: duration.normal, ease: easing.exit } },
};

export const slideFromLeftVariants: Variants = {
  hidden: { x: -280, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { x: -280, opacity: 0, transition: { duration: duration.normal } },
};

export const slideFromRightVariants: Variants = {
  hidden: { x: 280, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { x: 280, opacity: 0, transition: { duration: duration.normal } },
};

export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: duration.fast, ease: easing.enter } },
  exit: { opacity: 0, scale: 0.95, y: -4, transition: { duration: duration.instant } },
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.normal } },
};

export const pageTransitionVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: duration.moderate, ease: easing.enter } },
  exit: { opacity: 0, y: -4, transition: { duration: duration.fast } },
};

export const cartItemVariants: Variants = {
  hidden: { opacity: 0, height: 0, scale: 0.8 },
  visible: { opacity: 1, height: 'auto', scale: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } },
  exit: { opacity: 0, height: 0, scale: 0.8, transition: { duration: duration.normal } },
};
