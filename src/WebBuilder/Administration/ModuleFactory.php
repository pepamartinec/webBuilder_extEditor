<?php
namespace WebBuilder\Administration;

use Inspirio\Database\cDatabase;
use ExtAdmin\ModuleFactoryInterface;

class ModuleFactory implements ModuleFactoryInterface
{
	/**
	 * @var cDatabase
	 */
	protected $database;

	/**
	 * @var \SimpleXMLElement
	 */
	protected $labels;

	/**
	 * Constructor
	 *
	 * @param cDatabase $database
	 * @param \SimpleXMLElement $labels
	 */
	public function __construct( cDatabase $database, \SimpleXMLElement $labels )
	{
		$this->database = $database;
		$this->labels   = $labels;
	}

	/**
	 * Returns list of available module names
	 *
	 * FIXME this should be dynamic
	 *
	 * @return array
	 */
	public function getModulesList()
	{
		return array(
			__NAMESPACE__.'\\BlockManager\\BlocksList',
			__NAMESPACE__.'\\BlockManager\\CategoryEditor',
			__NAMESPACE__.'\\TemplateManager\\TemplateList',
			__NAMESPACE__.'\\TemplateManager\\TemplateEditor',
		);
	}

	/**
	 * Creates instance of requested module
	 *
	 * @param  string  $moduleName
	 * @return ExtAdmin\ModuleInterface
	 */
	public function factoryModule( $moduleName )
	{
		return new $moduleName( $this->database, $this->labels );
	}
}