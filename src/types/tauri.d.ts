// Tauri 插件类型声明（Web 端不需要实际安装）
declare module '@tauri-apps/plugin-http' {
  export function fetch(url: string, init?: RequestInit): Promise<Response>;
}

// CSS Module 声明
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

declare module '*.css' {
  const content: string;
  export default content;
}
