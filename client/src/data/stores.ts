import { observable } from "mobx"

class UserStore {
    @observable pfp?: string;
    @observable id?: string;
    @observable name?: string;
    @observable guest?: boolean;
}

class GlobalStore {
    user = new UserStore();

    @observable token?: string;

    @observable defaultRoom?: string;
    @observable volume: number = 1;
}

const store = new GlobalStore()

export default store;