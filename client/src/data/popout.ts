import { observable } from "mobx"

interface BoxPos {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  maxHeight?: number;
}

class PopoutStore {
    @observable width: number = 300;
    @observable pos: BoxPos = {};
    @observable showing: boolean = false;
    children?: any;
    lastButton?: any;
}

const popoutStore = new PopoutStore()

export default popoutStore;