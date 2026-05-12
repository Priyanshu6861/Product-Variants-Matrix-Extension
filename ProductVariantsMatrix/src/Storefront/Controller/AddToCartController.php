<?php

declare(strict_types=1);

namespace ProductVariantsMatrix\Storefront\Controller;

use Shopware\Core\Checkout\Cart\LineItemFactoryHandler\ProductLineItemFactory;
use Shopware\Core\Checkout\Cart\SalesChannel\CartService;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Controller\StorefrontController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

/**
 * AddToCartController handles adding variant products to the cart.
 */
#[Route(defaults: ['_routeScope' => ['storefront']])]
class AddToCartController extends StorefrontController
{
    /**
     * @var CartService the cart service for managing the cart operations
     */
    private CartService $cartService;

    /**
     * @var ProductLineItemFactory the factory responsible for creating product line items
     */
    private ProductLineItemFactory $productLineItemFactory;

    /**
     * Constructor for AddToCartController.
     *
     * @param CartService            $cartService            handles cart management
     * @param ProductLineItemFactory $productLineItemFactory creates product line items
     */
    public function __construct(CartService $cartService, ProductLineItemFactory $productLineItemFactory)
    {
        $this->cartService = $cartService;
        $this->productLineItemFactory = $productLineItemFactory;
    }

    /**
     * Adds variant products to the cart in bulk based on request data.
     *
     * @param Request             $request the HTTP request containing variant product data
     * @param SalesChannelContext $context the current sales channel context
     *
     * @return JsonResponse a JSON response indicating the success of the operation
     */
    #[Route(path: '/cart/addVariants', name: 'frontend.matrix.checkout.addVariants', options: ['seo' => 'false'], methods: ['POST'], defaults: ['XmlHttpRequest' => true, '_routeScope' => ['storefront'], '_httpCache' => true])]
    public function addCartMatrix(Request $request, SalesChannelContext $context): JsonResponse
    {
        // Decode the JSON request content into an associative array
        $data = \json_decode($request->getContent(), true);

        // Check if 'variantsIds' exists in the request data
        if (isset($data['variantsIds'])) {
            // Extract the variants data
            $variants = $data['variantsIds'];
            // Call the method to add the variants to the cart
            $this->addToCart($variants, $context);
        }

        // Return a JSON response indicating success
        return new JsonResponse(['success' => true]);
    }

    /**
     * Helper function to add a list of products to the cart.
     *
     * @param array               $productId           list of product variant IDs and quantities
     * @param SalesChannelContext $salesChannelContext the current sales channel context
     *
     * @return void
     */
    private function addToCart(array $productId, SalesChannelContext $salesChannelContext): void
    {
        // Retrieve the current cart based on the session token
        $cart = $this->cartService->getCart($salesChannelContext->getToken(), $salesChannelContext);

        // Loop through the product variants to be added to the cart
        foreach ($productId as $item) {
            // Create a product line item using the factory
            $product = $this->productLineItemFactory->create(['id' => $item['id']], $salesChannelContext);
            // Set the desired quantity for the product
            $product->setQuantity((int) $item['qty']);
            // Add the product to the cart
            $cart = $this->cartService->add($cart, $product, $salesChannelContext);
        }

        // Add a success message to the session flash bag
        $this->addFlash(
            self::SUCCESS,
            $this->trans('checkout.addToCartSuccess', ['%count%' => \count($productId)])
        );
    }
}
