<?php
namespace WebBuilder\Administration\TemplateManager;

use WebBuilder\DataDependencies\ConstantData;
use WebBuilder\DataDependencies\InheritedData;
use ExtAdmin\Request\AbstractRequest;
use WebBuilder\BlockInstance;

class BlockInstanceImporter
{
	/**
	 * Creates a block instances from the data received from the client-side
	 *
	 * @param array $clientData
	 * @return array
	 */
	public static function import( array $clientData )
	{
		$instanceSet  = array();
		$rootInstance = self::import_instance( $clientData, null, $instanceSet );

		return $instanceSet;
	}

	private static function import_instance( array $clientData, BlockInstance $parent = null, array &$instanceSet )
	{
		// FIXME remove AbstractRequest dependency!!!!
		$instanceID = AbstractRequest::secureData( $clientData, 'ID', 'int' ) ?: null;
		$tmpID      = AbstractRequest::secureData( $clientData, 'tmpID', 'string' ) ?: null;

		if( ! isset( $instanceSet[ $tmpID ] ) ) {
			$instanceSet[ $tmpID ] = new BlockInstance( null );
		}

		$instance = $instanceSet[ $tmpID ];

		$instance->ID         = $instanceID;
		$instance->blockSetID = AbstractRequest::secureData( $clientData, 'blockSetID', 'int' );
		$instance->parent     = $parent;
		$instance->templateID = AbstractRequest::secureData( $clientData, 'templateID', 'int' );

		// import data
		if( isset( $clientData['data'] ) && is_array( $clientData['data'] ) ) {
			foreach( $clientData['data'] as $rawProperty => $rawValue ) {
				$property = AbstractRequest::secureValue( $rawProperty, 'string' );

				// inherited data
				if( is_array( $rawValue ) ) {
					if( isset( $rawValue['providerID'], $rawValue['providerProperty'] ) ) {
						$providerID       = AbstractRequest::secureValue( $rawValue['providerID'], 'int' );
						$providerProperty = AbstractRequest::secureValue( $rawValue['providerProperty'], 'string' );

						if( $providerID && $providerProperty ) {
							// create dummy provider for now
							if( ! isset( $instanceSet[ $providerID ] ) ) {
								$instances[ $providerID ] = new self( null );
							}

							$instance->dataDependencies[ $property ] = new InheritedData( $instance, $property, $instanceSet[ $providerID ], $providerProperty );
						}
					}

				// constant data
				} else {
					$value = AbstractRequest::secureValue( $rawValue, 'string' );

					if( $value !== '' ) {
						$instance->dataDependencies[ $property ] = new ConstantData( $property, $value );
					}
				}
			}
		}

		// import children
		if( isset( $clientData['slots'] ) && is_array( $clientData['slots'] ) ) {
			foreach( $clientData['slots'] as $rawCodeName => $children ) {
				$codeName = AbstractRequest::secureValue( $rawCodeName, 'string' );

				if( $codeName == null || ! is_array( $children ) ) {
					continue;
				}

				$instance->slots[ $codeName ] = array();
				$slot = &$instance->slots[ $codeName ];

				foreach( $children as $rawChild ) {
					$slot[] = self::import_instance( $rawChild, $instance, $instanceSet );
				}
			}
		}

		return $instance;
	}
}