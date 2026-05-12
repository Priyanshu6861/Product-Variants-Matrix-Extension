<?php

declare(strict_types=1);

namespace ProductVariantsMatrix;

use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\Plugin;
use Shopware\Core\Framework\Plugin\Context\ActivateContext;
use Shopware\Core\Framework\Plugin\Context\DeactivateContext;
use Shopware\Core\Framework\Plugin\Context\InstallContext;
use Shopware\Core\Framework\Plugin\Context\UninstallContext;
use Shopware\Core\Framework\Plugin\Context\UpdateContext;
use Shopware\Core\Framework\Uuid\Uuid;

class ProductVariantsMatrix extends Plugin
{
    public function install(InstallContext $context): void
    {
        parent::install($context);

        $container = $this->container;

        /** @var EntityRepositoryInterface $customFieldSetRepository */
        $customFieldSetRepository = $container->get('custom_field_set.repository');

        /** @var EntityRepositoryInterface $customFieldRepository */
        $customFieldRepository = $container->get('custom_field.repository');

        $customFieldSetName = 'product_matrix';
        $customFieldName = 'matrix_enabled';

        $customFieldSetCriteria = new Criteria();
        $customFieldSetCriteria->addFilter(new EqualsFilter('name', $customFieldSetName));
        $existingCustomFieldSet = $customFieldSetRepository->search($customFieldSetCriteria, $context->getContext())->first();

        // If the custom field set doesn't exist, create it
        if (!$existingCustomFieldSet) {
            $customFieldSetId = Uuid::randomHex();
            $customFieldSetRepository->upsert([
                [
                    'id' => $customFieldSetId,
                    'name' => $customFieldSetName,
                    'config' => [],
                    'relations' => [
                        ['entityName' => 'product'],
                    ],
                ],
            ], $context->getContext());
        } else {
            $customFieldSetId = $existingCustomFieldSet->getId();
        }
        $customFieldCriteria = new Criteria();
        $customFieldCriteria->addFilter(new EqualsFilter('name', $customFieldName));
        $existingCustomField = $customFieldRepository->search($customFieldCriteria, $context->getContext())->first();

        // If the custom field doesn't exist, create it
        if (!$existingCustomField) {
            $customFieldRepository->upsert([
                [
                    'id' => Uuid::randomHex(),
                    'name' => $customFieldName,
                    'type' => 'bool',
                    'customFieldSetId' => $customFieldSetId,
                    'config' => [
                        'type' => 'switch',
                        'label' => [
                            'en-GB' => 'Enable Product Matrix View',
                            'de-DE' => 'Produktmatrixansicht aktivieren',
                        ],
                        'componentName' => 'sw-field',
                        'customFieldType' => 'switch',
                    ],
                ],
            ], $context->getContext());
        }
    }

    public function uninstall(UninstallContext $uninstallContext): void
    {
        parent::uninstall($uninstallContext);

        if ($uninstallContext->keepUserData()) {
            return;
        }

        // Remove or deactivate the data created by the plugin
    }

    public function activate(ActivateContext $activateContext): void
    {
        // Activate entities, such as a new payment method
        // Or create new entities here, because now your plugin is installed and active for sure
    }

    public function deactivate(DeactivateContext $deactivateContext): void
    {
        // Deactivate entities, such as a new payment method
        // Or remove previously created entities
    }

    public function update(UpdateContext $updateContext): void
    {
        // Update necessary stuff, mostly non-database related
    }

    public function postInstall(InstallContext $installContext): void
    {
    }

    public function postUpdate(UpdateContext $updateContext): void
    {
    }
}
