import { get, post, put, destroy, patch } from './helpers/ApiRequestsHelper'
function getAll () {
  return get('users/myrestaurants')
}

function getDetail (id) {
  return get(`restaurants/${id}`)
}

function getRestaurantCategories () {
  return get('restaurantCategories')
}

function create (data) {
  return post('restaurants', data)
}

function update (id, data) {
  return put(`restaurants/${id}`, data)
}

function updateStatus (id, status) {
  return patch(`restaurants/${id}/status`, { status })
}
function remove (id) {
  return destroy(`restaurants/${id}`)
}
function promote (id, promote) {
  return patch(`restaurants/${id}/promote`, { promote })
}
export { getAll, getDetail, getRestaurantCategories, create, update, remove, updateStatus, promote }
