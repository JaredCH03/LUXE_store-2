const express = require('express');
const {
    getAllProducts,
    getProductById,
    getProductsByCategory,
    getMyProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductImages,
    checkStock        // ← IMPORTANTE: Importar checkStock
} = require('../controllers/productController');
const { protect, sellerOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Rutas públicas
router.get('/', getAllProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', getProductById);
router.get('/:id/images', getProductImages);

// Rutas protegidas (vendedor)
router.get('/seller/my', protect, sellerOnly, getMyProducts);
router.post('/', protect, sellerOnly, createProduct);
router.put('/:id', protect, sellerOnly, updateProduct);
router.delete('/:id', protect, sellerOnly, deleteProduct);

// Verificación de stock (protegida)
router.post('/check-stock', protect, checkStock);

module.exports = router;