const Wishlist = require('../models/Wishlist');

exports.getWishlist = async (req, res) => {
    try {
        const items = await Wishlist.getByUser(req.user.id);
        res.json({ success: true, items });
    } catch (error) {
        console.error('Error obteniendo wishlist:', error);
        res.status(500).json({ success: false, message: 'Error al obtener favoritos' });
    }
};

exports.addToWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        await Wishlist.add(req.user.id, productId);
        res.json({ success: true, message: 'Producto agregado a favoritos' });
    } catch (error) {
        console.error('Error agregando a wishlist:', error);
        res.status(500).json({ success: false, message: 'Error al agregar a favoritos' });
    }
};

exports.removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        await Wishlist.remove(req.user.id, productId);
        res.json({ success: true, message: 'Producto eliminado de favoritos' });
    } catch (error) {
        console.error('Error eliminando de wishlist:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar de favoritos' });
    }
};

exports.checkWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        const inWishlist = await Wishlist.isInWishlist(req.user.id, productId);
        res.json({ success: true, inWishlist });
    } catch (error) {
        console.error('Error verificando wishlist:', error);
        res.status(500).json({ success: false, message: 'Error al verificar favoritos' });
    }
};

exports.getWishlistCount = async (req, res) => {
    try {
        const count = await Wishlist.getCount(req.user.id);
        res.json({ success: true, count });
    } catch (error) {
        console.error('Error obteniendo conteo:', error);
        res.status(500).json({ success: false, message: 'Error al obtener conteo' });
    }
};