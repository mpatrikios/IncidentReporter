declare module 'officegen' {
  interface DocumentObject {
    createP(options?: any): any;
    addText(text: string, options?: any): void;
    addLineBreak(): void;
    addImage(image: any, options?: any): void;
    setDocTitle(title: string): void;
    setDocSubject(subject: string): void;
    setDocCreator(creator: string): void;
    generate(stream: any): void;
  }
  
  function officegen(type: string): DocumentObject;
  export = officegen;
}