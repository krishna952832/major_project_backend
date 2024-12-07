const productModel = require("../models/productModel");
const cloudinary = require("cloudinary");
const sendError = require("../utils/sendError");
const { filterData } = require("../utils/filterQuery");

// Add Product
const addProduct = async (req, res) => {
  try {
    const { name, rate, stocks, category, kilogramOption, image } = req.body;

    // Validate input
    if (!name || !rate || !stocks || !category || !image ||!kilogramOption) {
      return sendError(res, 400, ["Missing required fields!"]);
    }

    if (!Array.isArray(kilogramOption) || kilogramOption.length === 0) {
      return sendError(res, 400, ["KilogramOption must be a non-empty array!"]);
    }

    // Upload image to Cloudinary
    const result = await cloudinary.v2.uploader.upload(image, {
      folder: "products",
    });

    // Create new product
    const newProduct = await productModel.create({
      name,
      rate,
      stocks,
      category,
      kilogramOption,
      public_id: result.public_id,
      url: result.url,
    });

    res.status(201).json({
      success: true,
      message: "Product added successfully!",
      newProduct,
    });
  } catch (error) {
    console.error(error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => err.message);
      return sendError(res, 400, errors);
    }

    sendError(res, 500, ["Something went wrong while adding the product!"]);
  }
};

// Delete Product
const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return sendError(res, 400, "Product ID is required!");
    }

    const product = await productModel.findById(productId);

    if (!product) {
      return sendError(res, 404, "Product not found!");
    }

    // Delete image from Cloudinary
    await cloudinary.v2.uploader.destroy(product.public_id);

    // Delete product from database
    await productModel.findByIdAndDelete(productId);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully!",
    });
  } catch (error) {
    console.error(error);
    sendError(res, 500, ["Something went wrong while deleting the product!"]);
  }
};

// Update Product
const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, rate, kilogramOption, category, stocks, image } = req.body;

    if (!productId) {
      return sendError(res, 400, "Product ID is required!");
    }

    const product = await productModel.findById(productId);

    if (!product) {
      return sendError(res, 404, "Product not found!");
    }

    if (image) {
      // Update image on Cloudinary
      await cloudinary.v2.uploader.destroy(product.public_id);
      const result = await cloudinary.v2.uploader.upload(image, {
        folder: "products",
      });
      product.url = result.url;
      product.public_id = result.public_id;
    }

    // Update other fields
    product.name = name || product.name;
    product.rate = rate || product.rate;
    product.category = category || product.category;
    product.stocks = stocks || product.stocks;

    if (Array.isArray(kilogramOption)) {
      product.kilogramOption = kilogramOption;
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully!",
    });
  } catch (error) {
    console.error(error);
    sendError(res, 500, ["Something went wrong while updating the product!"]);
  }
};

// Retrieve All Products
const getAllProduct = async (req, res) => {
  try {
    const productsDocCount = await productModel.countDocuments();
    const queryStr = filterData(productModel.find(), req.query);
    const products = await queryStr.populate("category");

    res.status(200).json({
      success: true,
      message: "Products retrieved successfully!",
      products,
      productsDocCount,
    });
  } catch (error) {
    console.error(error);
    sendError(res, 500, ["Something went wrong while retrieving the products!"]);
  }
};

// Retrieve Recent Products
const getRecentProducts = async (req, res) => {
  try {
    const products = await productModel.find().sort({ date: -1 }).limit(10);

    res.status(200).json({
      success: true,
      message: "Recent products retrieved successfully!",
      products,
    });
  } catch (error) {
    console.error(error);
    sendError(res, 500, ["Something went wrong while retrieving recent products!"]);
  }
};

// Retrieve Single Product
const getSingleProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return sendError(res, 400, "Product ID is required!");
    }

    const product = await productModel.findById(productId).populate("category");

    if (!product) {
      return sendError(res, 404, "Product not found!");
    }

    res.status(200).json({
      success: true,
      message: "Product retrieved successfully!",
      product,
    });
  } catch (error) {
    console.error(error);
    sendError(res, 500, ["Something went wrong while retrieving the product!"]);
  }
};

module.exports = {
  addProduct,
  deleteProduct,
  updateProduct,
  getAllProduct,
  getRecentProducts,
  getSingleProduct,
};
