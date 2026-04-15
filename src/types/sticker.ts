export type StickerIcon =
  | ''
  | 'star'
  | 'heart'
  | 'check'
  | 'cloud'
  | 'filter'
  | 'alarm'
  | 'bolt'
  | 'bookmark'
  | 'box'
  | 'bulb'
  | 'prio'
  | 'code'
  | 'ruble'
  | 'dollar'
  | 'euro'
  | 'eye'
  | 'flag'
  | 'flame'
  | 'history'
  | 'info'
  | 'key'
  | 'anchor'
  | 'message'
  | 'movie'
  | 'mnote'
  | 'pencil'
  | 'picture'
  | 'pin'
  | 'clockwise'
  | 'clockwiseDot'
  | 'rectangle'
  | 'shield'
  | 'stack'
  | 'string'
  | 'timeStop'
  | 'design'
  | 'user'
  | 'plus'
  | 'gear'
  | 'sort'
  | 'calendar';

/** StringStickerStateDto */
export interface StringStickerState {
  deleted?: boolean;
  id: string;
  name: string;
  color?: string;
}

/** StringStickerWithStatesDto */
export interface StringSticker {
  id: string;
  deleted?: boolean;
  name: string;
  icon?: StickerIcon;
  states?: StringStickerState[];
  limit?: number;
  offset?: number;
}

/** CreateStringStickerStateDto */
export interface CreateStringStickerState {
  name: string;
  color?: string;
}

/** UpdateStringStickerStateDto */
export interface UpdateStringStickerState {
  deleted?: boolean;
  name?: string;
  color?: string;
}

/** CreateStringStickerDto */
export interface CreateStringSticker {
  name: string;
  icon?: StickerIcon;
  states?: CreateStringStickerState[];
}

/** UpdateStringStickerDto */
export interface UpdateStringSticker {
  deleted?: boolean;
  name?: string;
  icon?: StickerIcon;
}

/** SprintStickerStateDto — begin/end are timestamps in seconds */
export interface SprintStickerState {
  deleted?: boolean;
  id: string;
  name: string;
  begin?: number;
  end?: number;
}

/** SprintStickerWithStatesDto */
export interface SprintSticker {
  id: string;
  deleted?: boolean;
  name: string;
  icon?: StickerIcon;
  states?: SprintStickerState[];
}

/** CreateSprintStickerStateDto */
export interface CreateSprintStickerState {
  name: string;
  begin?: number;
  end?: number;
}

/** UpdateSprintStickerStateDto */
export interface UpdateSprintStickerState {
  deleted?: boolean;
  name?: string;
  begin?: number;
  end?: number;
}

/** CreateSprintStickerDto */
export interface CreateSprintSticker {
  name: string;
  states?: CreateSprintStickerState[];
}

/** UpdateSprintStickerDto */
export interface UpdateSprintSticker {
  deleted?: boolean;
  name?: string;
}

/** WithStickerStateIdDto */
export interface WithStickerStateIdResponse {
  id: string;
}
