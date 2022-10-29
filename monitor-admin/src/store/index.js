import Vue from 'vue'
import Vuex from 'vuex'
import app from './modules/app'
import errorLog from './modules/errorLog'
import user from './modules/user'
import tagsView from './modules/tagsView'
import permission from './modules/permission'
import settings from './modules/settings'
import getters from './getters'
import VuexPersistence from 'vuex-persist'

const vuexLocal = new VuexPersistence({
  storage: window.localStorage,
  supportCircular: true,
  reducer: (state) => ({
    user: {
      token: state.user.token,
      avatar: state.user.avatar,
      name: state.user.name,
      introduction: state.user.introduction,
      roles: state.user.roles,
      roleIds: state.user.roleIds,
      userInfo: state.user.userInfo,
      authorities: state.user.authorities
    }
  })
})

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    app,
    errorLog,
    user,
    tagsView,
    permission,
    settings
  },
  getters,
  plugins: [vuexLocal.plugin]
})

export default store
