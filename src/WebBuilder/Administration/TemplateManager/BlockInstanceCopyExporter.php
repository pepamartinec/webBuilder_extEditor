<?php
namespace WebBuilder\Administration\TemplateManager;

use WebBuilder\DataDependencies\ConstantData;
use WebBuilder\BlockInstance;

class BlockInstanceCopyExporter
{
	/**
	 * Exports the BlockInstance for client-side usage
	 *
	 * @return array
	 */
	public static function export( BlockInstance $instance )
	{
		$data = array(
			'blockID'    => $instance->blockID,
			'templateID' => $instance->templateID,
			'slots'      => array(),
			'data'       => array(),
		);

		foreach( $instance->slots as $slotName => $children ) {
			$data['slots'][ $slotName ] = array();

			foreach( $children as $child ) { /* @var $child BlockInstance */
				$data['slots'][ $slotName ][] = self::export( $child );
			}
		}

		foreach( $instance->dataDependencies as $dependency ) { /* @var $dependency DataDependencyInterface */
			if( ! $dependency instanceof ConstantData ) {
				continue;
			}

			$data['data'][ $dependency->getProperty() ] = $dependency->export();
		}

		return $data;
	}
}