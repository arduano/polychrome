import { observable } from "mobx"

interface BoxPos {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  maxHeight?: number;
  topHeightSubtract?: number;
  minTop?: number;
}

class PopoutStore {
    @observable width: number = 300;
    @observable pos: BoxPos = {};
    @observable showing: boolean = false;
    children?: any;
    lastButton?: any;
    id: number = 0;
}

const popoutStore = new PopoutStore()

export default popoutStore;