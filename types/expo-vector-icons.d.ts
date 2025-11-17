declare module '@expo/vector-icons' {
  import { ComponentType } from 'react';
  const Feather: ComponentType<any>;
  export { Feather };
}

declare module '@expo/vector-icons/*' {
  import { ComponentType } from 'react';
  const IconComponent: ComponentType<any>;
  export default IconComponent;
}

