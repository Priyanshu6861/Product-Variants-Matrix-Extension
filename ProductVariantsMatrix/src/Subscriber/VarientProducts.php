<?php

declare(strict_types=1);

namespace ProductVariantsMatrix\Subscriber;

use Shopware\Core\Checkout\Customer\CustomerEntity;
use Shopware\Core\Content\Product\Events\ProductListingResultEvent;
use Shopware\Core\Content\Product\ProductEvents;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsAnyFilter;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Shopware\Storefront\Page\Product\ProductPageLoadedEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class VarientProducts implements EventSubscriberInterface
{
    public function __construct(private EntityRepository $productRepository, private SystemConfigService $systemConfigService) {}

    public static function getSubscribedEvents(): array
    {
        return [
            ProductPageLoadedEvent::class => 'onProductPageLoaded',
            ProductEvents::PRODUCT_LISTING_RESULT => 'onProductListPageLoaded',
        ];
    }

    public function onProductListPageLoaded(ProductListingResultEvent $event): void
    {
        if (!$this->systemConfigService->get('ProductVariantsMatrix.config.configMatrixEnable')) {
            return;
        }
        $pluginConfiguration = $this->systemConfigService->get('ProductVariantsMatrix.config');
        $enableCategories = $this->systemConfigService->get('ProductVariantsMatrix.config.enableCategories') ?? [];
        $category = $event->getRequest()->get('navigationId', $event->getSalesChannelContext()->getSalesChannel()->getNavigationCategoryId());
        if (\in_array($category, $enableCategories, true)) {
            /** @var ProductEntity $product */
            foreach ($event->getResult()->getElements() as $product) {
                $matrixEnabled = $this->isProductOptionEnableFromAdmin($product->getParentId() ?: $product->getId(), $event->getContext());
                $customer = $event->getSalesChannelContext()->getCustomer();
                $disableCustomerGroup = $this->systemConfigService->get('ProductVariantsMatrix.config.disableCustomerGroup');
                if ($this->isCustomerInRestrictedGroup($customer, $disableCustomerGroup) && $matrixEnabled !== true) {
                    return;
                }
                $variantProducts = $this->getVariants($product->getParentId() ?: $product->getId(), $matrixEnabled, $event->getContext());
                // Attach matrix data to the product to be used in the template
                $product->addExtension('VariantMatrix', $variantProducts);
                $product->addArrayExtension('pluginConfiguration', $pluginConfiguration);
            }
        }
    }

    /**
     * Adds variant products and plugin configuration to the product page.
     *
     * @param ProductPageLoadedEvent $event
     */
    public function onProductPageLoaded(ProductPageLoadedEvent $event): void
    {
        if (!$this->systemConfigService->get('ProductVariantsMatrix.config.configMatrixEnable')) {
            return;
        }
        $customer = $event->getSalesChannelContext()->getCustomer();
        $disableCustomerGroup = $this->systemConfigService->get('ProductVariantsMatrix.config.disableCustomerGroup');

        $product = $event->getPage()->getProduct();
        $parentId = $product->getParentId() ?: $product->getId();

        $matrixEnabled = $this->isProductOptionEnableFromAdmin($parentId, $event->getContext());
        // Check if customer is logged in and belongs to the restricted group
        if ($this->isCustomerInRestrictedGroup($customer, $disableCustomerGroup) && $matrixEnabled !== true) {
            return;
        }

        $variantProducts = $this->getVariants($parentId, $matrixEnabled, $event->getContext());
        // Attach matrix data to the product to be used in the template
        $pluginConfiguration = $this->systemConfigService->get('ProductVariantsMatrix.config');
        $event->getPage()->addExtension('variantProducts', $variantProducts);
        $event->getPage()->addArrayExtension('pluginConfiguration', $pluginConfiguration);
    }

    private function getVariants($productId, $matrixEnabled, $context)
    {
        $dynamicProductGroupIds = $this->systemConfigService->get('ProductVariantsMatrix.config.showDymanicProd');
        $criteria = new Criteria();
        $criteria->addFilter(new EqualsFilter('parentId', $productId))
            ->addFilter(new EqualsFilter('active', 1))
            ->addAssociation('options.group')
            ->addAssociation('price')
            ->addAssociation('options.media');

        // Checking Dynamic Product Group for Product
        if (($dynamicProductGroupIds || !empty($dynamicProductGroupIds)) && $matrixEnabled !== true) {
            $criteria->addFilter(new EqualsAnyFilter('streamIds', $dynamicProductGroupIds));
        }

        return $this->productRepository->search($criteria, $context)->getEntities();
    }

    /**
     * Check if the customer is logged in and belongs to one of the restricted customer groups.
     *
     * @param CustomerEntity|null $customer
     * @param array|string        $restrictedGroups
     *
     * @return bool
     */
    private function isCustomerInRestrictedGroup(?CustomerEntity $customer, $restrictedGroups): bool
    {
        if ($customer === null || empty($restrictedGroups)) {
            return false;
        }

        $customerGroupId = $customer->getGroupId();
        if (\is_string($restrictedGroups)) {
            $restrictedGroups = \explode(',', $restrictedGroups); // assuming it's a comma-separated string
        }

        return \in_array($customerGroupId, $restrictedGroups, true);
    }

    /**
     * Check if the product option is enable in admin custom fields.
     *
     * @return bool
     */
    private function isProductOptionEnableFromAdmin($productId, $context): bool
    {
        $criteria = new Criteria([$productId]);
        $criteria->addAssociation('customFields');

        /** @var ProductEntity $productData */
        $productData = $this->productRepository->search($criteria, $context)->first();

        if (!$productData) {
            return false;
        }

        $customFields = $productData->getCustomFields();

        return $customFields['matrix_enabled'] ?? false;
    }
}
