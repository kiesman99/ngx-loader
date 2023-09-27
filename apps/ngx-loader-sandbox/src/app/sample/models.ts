export interface PageOptions {
  count: number;
  pages: number;
  next: string;
  prev: string;
}

export interface RMCharacter {
  id: number;
  name: string;
  status: string;
  species: string;
  type: string;
  gender: string;
  origin: {
    name: string;
    url: string;
  };
  location: {
    name: string;
    url: string;
  };
  image: string;
  episode: Array<string>;
  url: string;
  created: string;
}

export interface RMReq {
  info: PageOptions;
  results: Array<RMCharacter>;
}
