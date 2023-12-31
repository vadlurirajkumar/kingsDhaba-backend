const DeliveryPerson = require("../model/deliveryPersonModel");
const User = require("../model/usermodel");

// signup delivery person
const createDeliveryBoy = async (req, res) => {
  try {
    const { mobile, fullname, password, area } = req.body;
    const existingDelBoy = await DeliveryPerson.findOne({ mobile });
    if (existingDelBoy) {
      return res.status(400).json({
        status: false,
        message: "Delivery Boy already exists with this mobile number",
        response: [],
      });
    }
    const newDelBoy = await DeliveryPerson.create({
      fullname,
      mobile,
      password,
      area,
      status: "active", // set status to 'active' by default
    });
    res.status(200).json({
      status: true,
      message: "New delivery person created",
      response: [newDelBoy],
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
      response: [],
    });
  }
};

//login delivery person
const loginDeliveryBoy = async (req, res) => {
  try {
    const { mobile, password, device_token } = req.body;
    if (!mobile || !password) {
      return res.status(400).json({
        status: false,
        message: "please enter all fields",
        response: [],
      });
    }
    const delBoy = await DeliveryPerson.findOne({ mobile });
    if (!delBoy) {
      return res.status(400).json({
        status: false,
        message: "delivery boy with this mobile number does not exist",
        response: [],
      });
    }
    if (delBoy.status === "inactive") {
      return res.status(400).json({
        status: false,
        message: "contact admin for log-in",
        response: [],
      });
    }

    const isMatch = await delBoy.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        status: false,
        message: "Password is incorrect",
        response: [],
      });
    }

    // Update device token if it has changed
    if (device_token && delBoy.device_token !== device_token) {
      delBoy.device_token = device_token;
      await delBoy.save();
    }

    res.status(200).json({
      status: true,
      message: `welcome ${delBoy.fullname}, Logged in successfully`,
      response: [{ ...delBoy._doc, device_token: delBoy.device_token }],
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
      response: [],
    });
  }
};

//change password
const changePassword = async (req, res) => {
  // const deliveryBoyId = req.params.id;
  const { newPassword, deliveryBoyId } = req.body;

  try {
    const deliveryBoy = await DeliveryPerson.findById(deliveryBoyId);
    if (!deliveryBoy) {
      return res.status(400).json({
        status: false,
        message: "Delivery Boy not found",
        response: [],
      });
    }
    deliveryBoy.password = newPassword;
    await deliveryBoy.save();

    const response = {
      deliveryBoyId: deliveryBoyId,
      fullName: deliveryBoy.fullname,
      mobile: deliveryBoy.mobile,
      password: deliveryBoy.password,
      status: deliveryBoy.status,
      area: deliveryBoy.area,
    };

    res.status(200).json({
      status: true,
      message: "Password changed successfully",
      response: response,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
      response: [],
    });
  }
};

// delivery boy onDuty toggle
const dbOnDuty = async (req, res) => {
  try {
    const delBoyId = req.params.id;
    const delBoy = await DeliveryPerson.findById(delBoyId);

    if (!delBoy) {
      return res.status(404).send({
        status: false,
        message: "deliverBoy not found",
      });
    }

    const newOnDuty = delBoy.onDuty === "on" ? "off" : "on";
    const updatedDelBoy = await DeliveryPerson.findByIdAndUpdate(
      delBoyId,
      { $set: { onDuty: newOnDuty } },
      { new: true }
    );

    const response = {
      id: updatedDelBoy._id,
      fullname: updatedDelBoy.fullname,
      area: updatedDelBoy.area,
      mobile: updatedDelBoy.mobile,
      password: updatedDelBoy.password,
      status: updatedDelBoy.status,
      onDuty: updatedDelBoy.onDuty,
      createdAt: updatedDelBoy.createdAt,
      updatedAt: updatedDelBoy.updatedAt,
    };

    res.status(200).send({
      status: true,
      message: "delivery boy onDuty status updated successfully",
      response: [response],
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      status: false,
      message: "Error in updating deliveryBoy status",
      error,
    });
  }
};

// get orders
const getOrders = async (req, res) => {
  const deliveryBoyId = req.params.id;
  try {
    const deliveryBoy = await DeliveryPerson.findById(deliveryBoyId);
    if (!deliveryBoy) {
      return res.status(400).json({
        status: false,
        message: "Delivery Boy not found",
        response: [],
      });
    }
    const orders = await User.find({
      $or: [{ "completedCart.deliveryPerson": deliveryBoy.fullname }],
    });
    if (!orders) {
      return res.json({
        status: false,
        message: "No orders found for this delivery boy",
        response: [],
      });
    }
    const formattedOrders = [];
    orders.forEach((user) => {
      user.completedCart.forEach((cart) => {
        if (
          cart.deliveryPerson === deliveryBoy.fullname &&
          cart.status === "pending for pickup" // Exclude carts with status "delivered"
        ) {
          formattedOrders.push({
            cartId: cart.cartId,
            buyer: user.fullname,
            location: user.location,
            latitude: user.latitude,
            longitude: user.longitude,
            transactionId: cart.transactionId,
            cookingInstructions: cart.cookingInstructions,
            ReceivedAmount: cart.ReceivedAmount,
            status: cart.status,
            updatedAt: cart.updatedAt,
            products: cart.products,
          });
        }
      });
    });

    // Sort orders by updatedAt in descending order
    formattedOrders.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    res.status(200).json({
      status: true,
      message: "Orders fetched successfully",
      response: formattedOrders,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      response: error.message,
    });
  }
};

//select single order
// const getSingleOrderDetails = async (req, res) => {
//   const { cartId } = req.body;
//   const deliveryBoyId = req.params.id;

//   try {
//     const deliveryBoy = await DeliveryPerson.findById(deliveryBoyId);
//     if (!deliveryBoy) {
//       return res.status(400).json({
//         status: false,
//         message: "Delivery Boy not found",
//         response: [],
//       });
//     }
//     const user = await User.findOne({
//       $or: [{ "completedCart.cartId": cartId }],
//     });
//     if (!user) {
//       return res.json({
//         status: false,
//         message: "User not found with this cartId",
//         response: [],
//       });
//     }
//     const cart = user.completedCart.find(
//       (cart) => cart.cartId.toString() === cartId
//     );
//     if (!cart) {
//       return res.json({
//         status: false,
//         message: "Cart not found with this cartId",
//         response: [],
//       });
//     }
//     if (cart.deliveryPerson !== deliveryBoy.fullname) {
//       return res.json({
//         status: false,
//         message: "Delivery Boy not authorized to view this cart",
//         response: [],
//       });
//     }

//     res.status(200).json({
//       status: true,
//       message: "Cart details fetched successfully",
//       response: {
//         cartId: cart.cartId,
//         buyer: user.fullname,
//         location: user.location,
//         latitude: user.latitude,
//         longitude: user.longitude,
//         transactionId: cart.transactionId,
//         cookingInstructions: cart.cookingInstructions,
//         ReceivedAmount: cart.ReceivedAmount,
//         status: cart.status,
//         products: cart.products,
//       },
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       status: false,
//       message: "Internal Server Error",
//       response: error.message,
//     });
//   }
// };
const getSingleOrderDetails = async (req, res) => {
  const { cartId } = req.params; // Extract cartId from route parameters
  const deliveryBoyId = req.params.id;

  try {
    const deliveryBoy = await DeliveryPerson.findById(deliveryBoyId);
    if (!deliveryBoy) {
      return res.status(400).json({
        status: false,
        message: "Delivery Boy not found",
        response: [],
      });
    }
    const user = await User.findOne({
      $or: [{ "completedCart.cartId": cartId }],
    });
    if (!user) {
      return res.json({
        status: false,
        message: "User not found with this cartId",
        response: [],
      });
    }
    const cart = user.completedCart.find(
      (cart) => cart.cartId.toString() === cartId
    );
    if (!cart) {
      return res.json({
        status: false,
        message: "Cart not found with this cartId",
        response: [],
      });
    }
    if (cart.deliveryPerson !== deliveryBoy.fullname) {
      return res.json({
        status: false,
        message: "Delivery Boy not authorized to view this cart",
        response: [],
      });
    }

    res.status(200).json({
      status: true,
      message: "Cart details fetched successfully",
      response: {
        cartId: cart.cartId,
        buyer: user.fullname,
        phone: user.mobile,
        location: user.location,
        latitude: user.latitude,
        longitude: user.longitude,
        transactionId: cart.transactionId,
        cookingInstructions: cart.cookingInstructions,
        ReceivedAmount: cart.ReceivedAmount,
        status: cart.status,
        products: cart.products,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      response: error.message,
    });
  }
};

// change status to pickup
const updateStatusToPickup = async (req, res) => {
  const { cartId } = req.params; // Extract cartId from route parameters
  const deliveryBoyId = req.params.id;

  try {
    const deliveryBoy = await DeliveryPerson.findById(deliveryBoyId);
    if (!deliveryBoy) {
      return res.status(400).json({
        status: false,
        message: "Delivery Boy not found",
        response: [],
      });
    }
    const user = await User.findOne({
      $or: [{ "completedCart.cartId": cartId }],
    });
    if (!user) {
      return res.json({
        status: false,
        message: "User not found with this cartId",
        response: [],
      });
    }
    const cartIndex = user.completedCart.findIndex(
      (cart) => cart.cartId.toString() === cartId
    );
    if (cartIndex === -1) {
      return res.json({
        status: false,
        message: "Cart not found with this cartId",
        response: [],
      });
    }
    const cart = user.completedCart[cartIndex];
    if (cart.deliveryPerson !== deliveryBoy.fullname) {
      return res.json({
        status: false,
        message: "Delivery Boy not authorized to update this cart",
        response: [],
      });
    }

    user.completedCart[cartIndex].status = "picked up";
    await user.save();

    res.status(200).json({
      status: true,
      message: "Cart status updated successfully",
      response: {
        cartId: cart.cartId,
        buyer: user.fullname,
        phone: user.mobile,
        location: user.location,
        latitude: user.latitude,
        longitude: user.longitude,
        transactionId: cart.transactionId,
        cookingInstructions: cart.cookingInstructions,
        ReceivedAmount: cart.ReceivedAmount,
        status: user.completedCart[cartIndex].status,
        updatedAt: new Date().toLocaleString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }),
        products: cart.products,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      response: error.message,
    });
  }
};

// get user location
const getLocationDetails = async (req, res) => {
  const { cartId } = req.params; // Extract cartId from route parameters
  const deliveryBoyId = req.params.id;

  try {
    const deliveryBoy = await DeliveryPerson.findById(deliveryBoyId);
    if (!deliveryBoy) {
      return res.status(400).json({
        status: false,
        message: "Delivery Boy not found",
        response: [],
      });
    }
    const user = await User.findOne({
      $or: [{ "completedCart.cartId": cartId }],
    });
    if (!user) {
      return res.json({
        status: false,
        message: "User not found with this cartId",
        response: [],
      });
    }
    const cartIndex = user.completedCart.findIndex(
      (cart) => cart.cartId.toString() === cartId
    );
    if (cartIndex === -1) {
      return res.json({
        status: false,
        message: "Cart not found with this cartId",
        response: [],
      });
    }
    const cart = user.completedCart[cartIndex];
    if (cart.deliveryPerson !== deliveryBoy.fullname) {
      return res.json({
        status: false,
        message: "Delivery Boy not authorized to view this cart",
        response: [],
      });
    }
    user.completedCart[cartIndex].status = "on the way";
    await user.save();
    res.status(200).json({
      status: true,
      message: "User location details fetched successfully",
      response: {
        location: user.location,
        latitude: user.latitude,
        longitude: user.longitude,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      response: error.message,
    });
  }
};
//change status to delivery
// const updateStatusToDelivery = async (req, res) => {
//   const { cartId } = req.params; // Extract cartId from route parameters
//   const deliveryBoyId = req.params.id;

//   try {
//     const deliveryBoy = await DeliveryPerson.findById(deliveryBoyId);
//     if (!deliveryBoy) {
//       return res.status(400).json({
//         status: false,
//         message: "Delivery Boy not found",
//         response: [],
//       });
//     }
//     const user = await User.findOne({
//       $or: [{ "completedCart.cartId": cartId }],
//     });
//     if (!user) {
//       return res.json({
//         status: false,
//         message: "User not found with this cartId",
//         response: [],
//       });
//     }
//     const cartIndex = user.completedCart.findIndex(
//       (cart) => cart.cartId.toString() === cartId
//     );
//     if (cartIndex === -1) {
//       return res.json({
//         status: false,
//         message: "Cart not found with this cartId",
//         response: [],
//       });
//     }
//     const cart = user.completedCart[cartIndex];
//     if (cart.deliveryPerson !== deliveryBoy.fullname) {
//       return res.json({
//         status: false,
//         message: "Delivery Boy not authorized to update this cart",
//         response: [],
//       });
//     }

//     user.completedCart[cartIndex].status = "delivered";
//     await user.save();

//     const updatedCart = {
//       cartId: cart.cartId,
//       buyer: user.fullname,
//       phone: user.mobile,
//       location: user.location,
//       latitude: user.latitude,
//       longitude: user.longitude,
//       transactionId: cart.transactionId,
//       cookingInstructions: cart.cookingInstructions,
//       ReceivedAmount: cart.ReceivedAmount,
//       status: user.completedCart[cartIndex].status,
//       updatedAt: new Date().toLocaleString("en-US", {
//         day: "numeric",
//         month: "short",
//         year: "numeric",
//         hour: "numeric",
//         minute: "numeric",
//         hour12: true,
//       }),
//       products: cart.products,
//     };

//     // Save the updated cart in the delivery boy's completedOrders array
//     deliveryBoy.completedOrders.push(updatedCart);
//     await deliveryBoy.save();

//     res.status(200).json({
//       status: true,
//       message: "Cart status updated successfully",
//       response: updatedCart,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       status: false,
//       message: "Internal Server Error",
//       response: error.message,
//     });
//   }
// };
const updateStatusToDelivery = async (req, res) => {
  const { cartId } = req.params; // Extract cartId from route parameters
  const deliveryBoyId = req.params.id;

  try {
    const deliveryBoy = await DeliveryPerson.findById(deliveryBoyId);
    if (!deliveryBoy) {
      return res.status(400).json({
        status: false,
        message: "Delivery Boy not found",
        response: [],
      });
    }
    const user = await User.findOne({
      $or: [{ "completedCart.cartId": cartId }],
    });
    if (!user) {
      return res.json({
        status: false,
        message: "User not found with this cartId",
        response: [],
      });
    }
    const cartIndex = user.completedCart.findIndex(
      (cart) => cart.cartId.toString() === cartId
    );
    if (cartIndex === -1) {
      return res.json({
        status: false,
        message: "Cart not found with this cartId",
        response: [],
      });
    }
    const cart = user.completedCart[cartIndex];
    if (cart.deliveryPerson !== deliveryBoy.fullname) {
      return res.json({
        status: false,
        message: "Delivery Boy not authorized to update this cart",
        response: [],
      });
    }

    user.completedCart[cartIndex].status = "delivered";
    await user.save();

    const updatedCart = {
      cartId: cart.cartId,
      buyer: user.fullname,
      phone: user.mobile,
      location: user.location,
      latitude: user.latitude,
      longitude: user.longitude,
      transactionId: cart.transactionId,
      cookingInstructions: cart.cookingInstructions,
      ReceivedAmount: cart.ReceivedAmount,
      status: user.completedCart[cartIndex].status,
      updatedAt: new Date().toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }),
      products: cart.products,
    };

    // Save the updated cart in the delivery boy's completedOrders array
    deliveryBoy.completedOrders.push(updatedCart);
    await deliveryBoy.save();

    const pendingCartIndex = user.pendingCart.findIndex(
      (cart) => cart.cartId.toString() === cartId
    );
    if (pendingCartIndex !== -1) {
      user.pendingCart.splice(pendingCartIndex, 1);
      await user.save();
    }

    res.status(200).json({
      status: true,
      message: "Cart status updated successfully",
      response: updatedCart,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      response: error.message,
    });
  }
};

// order history
const viewOrderHistory = async (req, res) => {
  const deliveryBoyId = req.params.id;

  try {
    const deliveryBoy = await DeliveryPerson.findById(deliveryBoyId);
    if (!deliveryBoy) {
      return res.status(400).json({
        status: false,
        message: "Delivery Boy not found",
        response: [],
      });
    }

    const orders = await User.find({
      $or: [{ "completedCart.deliveryPerson": deliveryBoy.fullname }],
    });
    if (!orders) {
      return res.json({
        status: false,
        message: "No orders found for this delivery boy",
        response: [],
      });
    }
    const formattedOrders = [];
    orders.forEach((user) => {
      user.completedCart.forEach((cart) => {
        if (
          cart.deliveryPerson === deliveryBoy.fullname &&
          cart.status !== "delivered" // Exclude carts with status "delivered"
        ) {
          formattedOrders.push({
            cartId: cart.cartId,
            buyer: user.fullname,
            location: user.location,
            latitude: user.latitude,
            longitude: user.longitude,
            transactionId: cart.transactionId,
            cookingInstructions: cart.cookingInstructions,
            ReceivedAmount: cart.ReceivedAmount,
            status: cart.status,
            createdAt: cart.createdAt,
            products: cart.products,
          });
        }
      });
    });

    const combinedOrders = [
      ...deliveryBoy.completedOrders.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      ),
      ...formattedOrders.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
    ];

    res.status(200).json({
      status: true,
      message: "Order history retrieved successfully",
      response: combinedOrders,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      response: error.message,
    });
  }
};

//order history only pending
const pendingHistory = async (req, res) => {
  const deliveryBoyId = req.params.id;
  try {
    const deliveryBoy = await DeliveryPerson.findById(deliveryBoyId);
    if (!deliveryBoy) {
      return res.status(400).json({
        status: false,
        message: "Delivery Boy not found",
        response: [],
      });
    }
    const orders = await User.find({
      $or: [{ "completedCart.deliveryPerson": deliveryBoy.fullname }],
    });
    if (!orders) {
      return res.json({
        status: false,
        message: "No orders found for this delivery boy",
        response: [],
      });
    }
    const formattedOrders = [];
    orders.forEach((user) => {
      user.completedCart.forEach((cart) => {
        if (
          cart.deliveryPerson === deliveryBoy.fullname &&
          (cart.status === "pending for pickup" || cart.status === "picked up")
        ) {
          formattedOrders.push({
            cartId: cart.cartId,
            buyer: user.fullname,
            location: user.location,
            latitude: user.latitude,
            longitude: user.longitude,
            transactionId: cart.transactionId,
            cookingInstructions: cart.cookingInstructions,
            ReceivedAmount: cart.ReceivedAmount,
            status: cart.status,
            updatedAt: cart.updatedAt,
            products: cart.products,
          });
        }
      });
    });

    // Sort orders by updatedAt in descending order
    formattedOrders.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    res.status(200).json({
      status: true,
      message: "Orders fetched successfully",
      response: formattedOrders,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      response: error.message,
    });
  }
};

//order history only completed
const deliveredHistory = async (req, res) => {
  const deliveryBoyId = req.params.id;
  try {
    const deliveryBoy = await DeliveryPerson.findById(deliveryBoyId);
    if (!deliveryBoy) {
      return res.status(400).json({
        status: false,
        message: "Delivery Boy not found",
        response: [],
      });
    }
    const orders = await User.find({
      $or: [{ "completedCart.deliveryPerson": deliveryBoy.fullname }],
    });
    if (!orders) {
      return res.json({
        status: false,
        message: "No orders found for this delivery boy",
        response: [],
      });
    }
    const formattedOrders = [];
    orders.forEach((user) => {
      user.completedCart.forEach((cart) => {
        if (
          cart.deliveryPerson === deliveryBoy.fullname &&
          cart.status === "delivered"
        ) {
          formattedOrders.push({
            cartId: cart.cartId,
            buyer: user.fullname,
            location: user.location,
            latitude: user.latitude,
            longitude: user.longitude,
            transactionId: cart.transactionId,
            cookingInstructions: cart.cookingInstructions,
            ReceivedAmount: cart.ReceivedAmount,
            status: cart.status,
            updatedAt: cart.updatedAt,
            products: cart.products,
          });
        }
      });
    });

    // Sort orders by updatedAt in descending order
    formattedOrders.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    res.status(200).json({
      status: true,
      message: "Orders fetched successfully",
      response: formattedOrders,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      response: error.message,
    });
  }
};

// const viewOrderHistory = async (req, res) => {
//   const deliveryBoyId = req.params.id;

//   try {
//     const deliveryBoy = await DeliveryPerson.findById(deliveryBoyId);
//     if (!deliveryBoy) {
//       return res.status(400).json({
//         status: false,
//         message: "Delivery Boy not found",
//         response: [],
//       });
//     }

//     const orders = await User.find({
//       "completedCart.deliveryPerson": deliveryBoy.fullname,
//       "completedCart.status": { $ne: "delivered" },
//     });
//     if (!orders || orders.length === 0) {
//       return res.json({
//         status: false,
//         message: "No orders found for this delivery boy",
//         response: [],
//       });
//     }

//     const formattedOrders = orders
//       .map((user) => {
//         return user.completedCart.map((cart) => {
//           return {
//             cartId: cart.cartId,
//             buyer: user.fullname,
//             location: user.location,
//             latitude: user.latitude,
//             longitude: user.longitude,
//             transactionId: cart.transactionId,
//             cookingInstructions: cart.cookingInstructions,
//             ReceivedAmount: cart.ReceivedAmount,
//             status: cart.status,
//             createdAt: cart.createdAt,
//             products: cart.products,
//           };
//         });
//       })
//       .flat();

//     const combinedOrders = [
//       ...deliveryBoy.completedOrders.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
//       ...formattedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
//     ];

//     res.status(200).json({
//       status: true,
//       message: "Order history retrieved successfully",
//       response: combinedOrders,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       status: false,
//       message: "Internal Server Error",
//       response: error.message,
//     });
//   }
// };

// add feedback
const addFeedback = async (req, res) => {
  const { feedback, deliveryBoyId } = req.body;

  try {
    const deliveryBoy = await DeliveryPerson.findById(deliveryBoyId);
    if (!deliveryBoy) {
      return res.status(400).json({
        status: false,
        message: "Delivery Boy not found",
        response: [],
      });
    }
    deliveryBoy.feedback.push({
      feedback,
      createdAt: new Date(),
    });
    await deliveryBoy.save();

    const sortedFeedback = deliveryBoy.feedback.sort(
      (a, b) => b.createdAt - a.createdAt
    );

    const response = {
      deliveryBoy: deliveryBoy.fullname,
      feedback: sortedFeedback,
    };

    return res.status(200).json({
      status: true,
      message: "Feedback added successfully",
      response: response,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      response: [],
    });
  }
};

//get notifications for deliveryBoy
const getNotificationsForDeliveryBoy = async (req, res) => {
  try {
    const deliveryBoyId = req.params.id;
    const deliveryBoy = await DeliveryPerson.findById(deliveryBoyId);
    if (!deliveryBoy) {
      return res.status(400).json({
        status: false,
        message: "Delivery Boy not found",
        response: [],
      });
    }

    const sortedNotifications = deliveryBoy.notifications.sort(
      (a, b) => b.createdAt - a.createdAt
    );

    res.status(201).json({
      status: true,
      message: "notifications fetch success",
      notifications: sortedNotifications,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: "Failed to get notifications",
    });
  }
};

// const sortHistoryByToday = async (req, res) => {
//   try {
//     const deliveryBoyId = req.params.id;
//     const today = new Date();
//     today.setHours(0, 0, 0, 0); // Set the time to the beginning of the day

//     const deliveryBoy = await DeliveryPerson.findById(deliveryBoyId);
//     if (!deliveryBoy) {
//       return res.status(400).json({
//         status: false,
//         message: "Delivery Boy not found",
//         response: [],
//       });
//     }

//     const orders = await User.find({
//       "completedCart.deliveryPerson": deliveryBoy.fullname,
//       "completedCart.status": { $ne: "delivered" }, // Exclude carts with status "delivered"
//       "completedCart.createdAt": { $gte: today }, // Filter by createdAt field for today's date
//     });

//     if (!orders || orders.length === 0) {
//       return res.json({
//         status: false,
//         message: "No orders found for this delivery boy",
//         response: [],
//       });
//     }

//     const formattedOrders = orders
//       .map((user) => {
//         return user.completedCart.map((cart) => {
//           return {
//             cartId: cart.cartId,
//             buyer: user.fullname,
//             location: user.location,
//             latitude: user.latitude,
//             longitude: user.longitude,
//             transactionId: cart.transactionId,
//             cookingInstructions: cart.cookingInstructions,
//             ReceivedAmount: cart.ReceivedAmount,
//             status: cart.status,
//             createdAt: cart.createdAt,
//             products: cart.products,
//           };
//         });
//       })
//       .flat();

//     const sortedOrders = formattedOrders.sort(
//       (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
//     );

//     res.status(200).json({
//       status: true,
//       message: "Order history sorted by today's date",
//       response: sortedOrders,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       status: false,
//       message: "Internal Server Error",
//       response: error.message,
//     });
//   }
// };
// const sortHistoryByDate = async (req, res) => {
//   const deliveryBoyId = req.params.id;

//   try {
//     const deliveryBoy = await DeliveryPerson.findById(deliveryBoyId);
//     if (!deliveryBoy) {
//       return res.status(400).json({
//         status: false,
//         message: "Delivery Boy not found",
//         response: [],
//       });
//     }

//     const today = new Date();
//     today.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to zero

//     const orders = await User.find({
//       $or: [{ "completedCart.deliveryPerson": deliveryBoy.fullname }],
//     });
//     if (!orders) {
//       return res.json({
//         status: false,
//         message: "No orders found for this delivery boy",
//         response: [],
//       });
//     }

//     const formattedOrders = [];
//     orders.forEach((user) => {
//       user.completedCart.forEach((cart) => {
//         if (
//           cart.deliveryPerson === deliveryBoy.fullname &&
//           cart.status !== "delivered" && // Exclude carts with status "delivered"
//           new Date(cart.updatedAt).setHours(0, 0, 0, 0) >= today // Only include orders with updatedAt date greater than or equal to today
//         ) {
//           formattedOrders.push({
//             cartId: cart.cartId,
//             buyer: user.fullname,
//             location: user.location,
//             latitude: user.latitude,
//             longitude: user.longitude,
//             transactionId: cart.transactionId,
//             cookingInstructions: cart.cookingInstructions,
//             ReceivedAmount: cart.ReceivedAmount,
//             status: cart.status,
//             updatedAt: cart.updatedAt,
//             products: cart.products,
//           });
//         }
//       });
//     });

//     const combinedOrders = [
//       ...deliveryBoy.completedOrders,
//       ...formattedOrders,
//     ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

//     res.status(200).json({
//       status: true,
//       message: "Order history retrieved successfully",
//       response: combinedOrders,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       status: false,
//       message: "Internal Server Error",
//       response: error.message,
//     });
//   }
// };
const sortHistoryByDate = async (req, res) => {
  const deliveryBoyId = req.params.id;

  try {
    const deliveryBoy = await DeliveryPerson.findById(deliveryBoyId);
    if (!deliveryBoy) {
      return res.status(400).json({
        status: false,
        message: "Delivery Boy not found",
        response: [],
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to zero

    const orders = await User.find({
      $or: [{ "completedCart.deliveryPerson": deliveryBoy.fullname }],
    });
    if (!orders) {
      return res.json({
        status: false,
        message: "No orders found for this delivery boy",
        response: [],
      });
    }

    const formattedOrders = orders.reduce((acc, user) => {
      const filteredCarts = user.completedCart.filter((cart) => {
        return (
          cart.deliveryPerson === deliveryBoy.fullname &&
          cart.status !== "delivered" && // Exclude carts with status "delivered"
          new Date(cart.updatedAt).setHours(0, 0, 0, 0) >= today // Only include orders with updatedAt date greater than or equal to today
        );
      });

      if (filteredCarts.length > 0) {
        const formattedCarts = filteredCarts.map((cart) => ({
          cartId: cart.cartId,
          buyer: user.fullname,
          location: user.location,
          latitude: user.latitude,
          longitude: user.longitude,
          transactionId: cart.transactionId,
          cookingInstructions: cart.cookingInstructions,
          ReceivedAmount: cart.ReceivedAmount,
          status: cart.status,
          updatedAt: cart.updatedAt,
          products: cart.products,
        }));

        return [...acc, ...formattedCarts];
      }

      return acc;
    }, []);

    const combinedOrders = [
      ...deliveryBoy.completedOrders,
      ...formattedOrders,
    ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.status(200).json({
      status: true,
      message: "Order history retrieved successfully",
      response: combinedOrders,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      response: error.message,
    });
  }
};

module.exports = {
  createDeliveryBoy,
  loginDeliveryBoy,
  changePassword,
  dbOnDuty,
  getOrders,
  getSingleOrderDetails,
  updateStatusToPickup,
  getLocationDetails,
  updateStatusToDelivery,
  viewOrderHistory,
  pendingHistory,
  deliveredHistory,
  addFeedback,
  getNotificationsForDeliveryBoy,
  sortHistoryByDate,
};
