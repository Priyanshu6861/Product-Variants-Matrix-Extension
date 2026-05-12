// Import all necessary Storefront plugins
import VarientProducts from './varient-products/varient-products.plugin';
import VarientMinimalProducts from './varient-minimal-products/varient-minimal-products';

// Register your plugin via the existing PluginManager
const PluginManager = window.PluginManager;

PluginManager.register('VarientProducts', VarientProducts, '[data-varient-plugin]');
PluginManager.register('VarientMinimalProducts', VarientMinimalProducts, '[data-varient-minimal-plugin]');
