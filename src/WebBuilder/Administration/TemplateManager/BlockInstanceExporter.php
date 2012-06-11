<?php
namespace WebBuilder\Administration\TemplateManager;

use WebBuilder\DataDependencies\UndefinedData;
use WebBuilder\BlockInstance;

class BlockInstanceExporter
{
	/**
	 * Exports the BlockInstance for client-side usage
	 *
	 * @return array
	 */
	public static function export( BlockInstance $instance )
	{
		$data = array(
			'ID'         => $instance->ID,
			'blockSetID' => $instance->blockSetID,
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
			if( $dependency instanceof UndefinedData ) {
				continue;
			}

			$data['data'][ $dependency->getProperty() ] = $dependency->export();
		}

		return $data;
	}
}