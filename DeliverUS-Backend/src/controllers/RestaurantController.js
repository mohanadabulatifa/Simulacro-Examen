import { Restaurant, Product, RestaurantCategory, ProductCategory } from '../models/models.js'

const index = async function (req, res) {
  try {
    const restaurants = await Restaurant.findAll(
      {
        attributes: { exclude: ['userId'] },
        include:
      {
        model: RestaurantCategory,
        as: 'restaurantCategory'
      },
        order: [[{ model: RestaurantCategory, as: 'restaurantCategory' }, 'name', 'ASC']]
      }
    )
    res.json(restaurants)
  } catch (err) {
    res.status(500).send(err)
  }
}

const indexOwner = async function (req, res) {
  try {
    const restaurants = await Restaurant.findAll(
      {
        attributes: { exclude: ['userId'] },
        where: { userId: req.user.id },
        include: [{
          model: RestaurantCategory,
          as: 'restaurantCategory'

        }],
        order: [['status', 'ASC'], ['name', 'ASC']]

      })
    res.json(restaurants)
  } catch (err) {
    res.status(500).send(err)
  }
}

const create = async function (req, res) {
  const newRestaurant = Restaurant.build(req.body)
  newRestaurant.userId = req.user.id // usuario actualmente autenticado
  try {
    const restaurant = await newRestaurant.save()
    res.json(restaurant)
  } catch (err) {
    res.status(500).send(err)
  }
}

const canChangeStatus = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const restaurant = await Restaurant.findByPk(restaurantId)
    if (!restaurant) {
      return res.status(404).send('Restaurant not found')
    }

    if (restaurant.status === 'closed' || restaurant.status === 'temporarily closed') {
      return res.status(403).send('Cannot change status of a closed or temporarily closed restaurant')
    }

    const orders = await restaurant.getOrders({ where: { deliveredAt: null } })
    const canChange = orders.length === 0

    res.json({ canChange })
  } catch (err) {
    res.status(500).send(err.message)
  }
}
const updateStatus = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const { status } = req.body

    const restaurant = await Restaurant.findByPk(restaurantId)
    if (!restaurant) {
      return res.status(404).send('Restaurant not found')
    }

    if (req.user.id !== restaurant.userId) {
      return res.status(403).send('Not enough privileges. This entity does not belong to you')
    }

    if ((restaurant.status === 'offline' && status === 'online') || (restaurant.status === 'online' && status === 'offline')) {
      const orders = await restaurant.getOrders({ where: { deliveredAt: null } })
      if (orders.length === 0) {
        restaurant.status = status
        await restaurant.save()
        res.json(restaurant)
      } else {
        res.status(400).send('Cannot change status with pending orders')
      }
    } else {
      res.status(400).send('Invalid status transition')
    }
  } catch (err) {
    res.status(500).send(err.message)
  }
}
// quiero que el usuario pueda promocionar su restaurante
const promote = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const restaurant = await Restaurant.findByPk(restaurantId)
    if (!restaurant) {
      return res.status(404).send('Restaurant not found')
    }
    if (req.user.id !== restaurant.userId) {
      return res.status(403).send('Not enough privileges. This entity does not belong to you')
    }
    // si la variable promotion es true, entonces el restaurante se promociona
    restaurant.promotion = true
    await restaurant.save() // guardo el cambio

    res.json(restaurant)
  } catch (err) {
    res.status(500).send(err.message)
  }
}

const show = async function (req, res) {
  // Only returns PUBLIC information of restaurants
  try {
    const restaurant = await Restaurant.findByPk(req.params.restaurantId, {
      attributes: { exclude: ['userId'] },
      include: [{
        model: Product,
        as: 'products',
        include: { model: ProductCategory, as: 'productCategory' }
      },
      {
        model: RestaurantCategory,
        as: 'restaurantCategory'
      }],
      order: [[{ model: Product, as: 'products' }, 'order', 'ASC']]
    }
    )
    res.json(restaurant)
  } catch (err) {
    res.status(500).send(err)
  }
}

const update = async function (req, res) {
  try {
    await Restaurant.update(req.body, { where: { id: req.params.restaurantId } })
    const updatedRestaurant = await Restaurant.findByPk(req.params.restaurantId)
    res.json(updatedRestaurant)
  } catch (err) {
    res.status(500).send(err)
  }
}

const destroy = async function (req, res) {
  try {
    const result = await Restaurant.destroy({ where: { id: req.params.restaurantId } })
    let message = ''
    if (result === 1) {
      message = 'Sucessfuly deleted restaurant id.' + req.params.restaurantId
    } else {
      message = 'Could not delete restaurant.'
    }
    res.json(message)
  } catch (err) {
    res.status(500).send(err)
  }
}

const RestaurantController = {
  index,
  indexOwner,
  create,
  show,
  update,
  destroy,
  updateStatus,
  canChangeStatus,
  promote
}
export default RestaurantController
