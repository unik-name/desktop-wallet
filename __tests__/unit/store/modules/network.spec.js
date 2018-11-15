import store from '@/store'
import config from '@config'

describe('network store modules', () => {
  it('should set the network defaults', () => {
    store.dispatch('network/load', config.NETWORKS)

    expect(store.getters['network/all']).toEqual(config.NETWORKS)
  })
})