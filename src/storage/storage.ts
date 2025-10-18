export abstract class Storage {
  abstract getFile(path: string);

  abstract saveFile(path: string, data: Buffer);

  abstract deleteFile(path: string);
}
