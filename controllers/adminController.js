const Admin = require("../model/adminModel");
const User = require("../model/usermodel");
const cloudinary = require("cloudinary");
const DeliveryPerson = require("../model/deliveryPersonModel");

// admin Login
const adminLogin = async (req, res) => {
  try {
    const { userId, password } = req.body;
    if (!userId || !password) {
      return res.status(400).json({
        status: false,
        message: "please enter all fields",
        response: [],
      });
    }

    // * Checking if Admin has registered or not
    let user = await Admin.findOne({ userId });
    if (!user) {
      return res.status(400).json({
        status: false,
        message: "invalid userId",
        response: [],
      });
    }
    if (user.password !== password) {
      return res.status(400).json({
        status: false,
        message: "invalid password",
        response: [],
      });
    }
    const token = user.generateToken();
    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token: token,
      data: user,
    });
  } catch (error) {
    return res.json({ status: false, message: error.message, response: [] });
  }
};

// Find Total Users
const totalUsers = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.json({
        status: false,
        message: "Admin not authorised",
        response: [],
      });
    }
    const user = await User.find({});
    if (user.length <= 0) {
      return res.json({
        status: false,
        message: "Users not found",
        response: [],
      });
    }
    return res.json({
      status: true,
      message: "users fetch success",
      response: [user],
    });
  } catch (error) {
    return res.json({ status: false, message: error.message, response: [] });
  }
};

// find total delivery boys
const totalDeliveryBoys = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.json({
        status: false,
        message: "Admin not authorised",
        response: [],
      });
    }
    const delBoy = await DeliveryPerson.find({});
    if (delBoy.length <= 0) {
      return res.json({
        status: false,
        message: "No Delivery Persons Found",
        response: [],
      });
    }
    return res.json({
      status: true,
      message: "delivery boys data fetch successful",
      response: [delBoy],
    });
  } catch (error) {
    return res.json({ status: false, message: error.message, response: [] });
  }
};

//Update user status
const updateUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({
        status: false,
        message: "User not found",
      });
    }

    const newStatus = user.status === "active" ? "inactive" : "active";
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { status: newStatus } },
      { new: true }
    );

    const response = {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      status: updatedUser.status,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    res.status(200).send({
      status: true,
      message: "User status updated successfully",
      response: [response],
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      status: false,
      message: "Error in updating user status",
      error,
    });
  }
};

//delivery person status update
const updateDeliveryboyStatus = async (req, res) => {
  try {
    const delBoyId = req.params.id;
    const delBoy = await DeliveryPerson.findById(delBoyId);

    if (!delBoy) {
      return res.status(404).send({
        status: false,
        message: "deliverBoy not found",
      });
    }

    const newStatus = delBoy.status === "active" ? "inactive" : "active";
    const updatedDelBoy = await DeliveryPerson.findByIdAndUpdate(
      delBoyId,
      { $set: { status: newStatus } },
      { new: true }
    );

    const response = {
      id: updatedDelBoy._id,
      fullname: updatedDelBoy.fullname,
      area: updatedDelBoy.area,
      mobile:updatedDelBoy.mobile,
      password:updatedDelBoy.password,
      status: updatedDelBoy.status,
      createdAt: updatedDelBoy.createdAt,
      updatedAt: updatedDelBoy.updatedAt,
    };

    res.status(200).send({
      status: true,
      message: "delivery boy status updated successfully",
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

// delete a user
const deleteUser = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.json({
        status: false,
        message: "Admin not authorised",
        response: [],
      });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.json({
        status: false,
        message: "User not found",
        response: [],
      });
    }
    return res.json({
      status: true,
      message: "User deleted successfully",
      response: user,
    });
  } catch (error) {
    return res.json({ status: false, message: error.message, response: [] });
  }
};

// delete delivery boy
const deleteDeliveryBoy = async (req,res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.json({
        status: false,
        message: "Admin not authorised",
        response: [],
      });
    }
    const delBoy = await DeliveryPerson.findByIdAndDelete(req.params.id);
    if (!delBoy) {
      return res.json({
        status: false,
        message: "Delivery Boy not found",
        response: [],
        
      });
    }
    return res.json({
      status: true,
      message: "Delivery Boy deleted successfully",
      response: delBoy,
    });
  } catch (error) {
    return res.json({ status: false, message: error.message, response: [] });
  }
}


module.exports = { adminLogin, totalUsers, totalDeliveryBoys, updateUserStatus,updateDeliveryboyStatus, deleteUser, deleteDeliveryBoy };
