<?php
namespace WebBuilder\Administration\BlockManager;

use ExtAdmin\Response\DataBrowserResponse;

use ExtAdmin\Response\ActionResponse;
use WebBuilder\DataObjects\BlocksCategory;

use Inspirio\Database\cDBFeederBase;

use ExtAdmin\Request\DataRequestDecorator;

use ExtAdmin\RequestInterface;

use Inspirio\Database\cDatabase;

use ExtAdmin\Module\DataBrowser\TreeList;

class BlocksList extends TreeList
{
	/**
	 * @var cDatabase
	 */
	protected $database;

	/**
	 * Module constructor
	 *
	 * @param cDatabase $database
	 * @param \SimpleXMLElement $labels
	 */
	public function __construct( cDatabase $database, \SimpleXMLElement $labels )
	{
		$this->database = $database;
	}

	/**
	 * Returns module actions definition
	 *
	 * Used for defining actions within concrete modules implementations
	 *
	 * @return array
	 */
	public function actions()
	{
		return array(
			'loadListData' => true,

			'createCategory' => array(
				'title'   => 'Vytvořit kategorii',
				'type'    => 'create',
				'params'  => array(
					'editor'      => 'CategoryEditor',
					'loadDefault' => 'loadData_new'
				),
			),

			'editCategory' => array(
				'title'   => 'Upravit kategorii',
				'type'    => 'edit',
				'params'  => array(
					'editor'      => 'CategoryEditor',
					'loadDefault' => 'loadData_record'
				),
			),

			'deleteCategory' => array(
				'title'  => 'Smazat kategorii',
				'type'   => 'delete',
				'params' => array(
					'action' => 'deleteCategory'
				)
			),

			'generateBlocks' => array(
				'title'   => 'Přegenerovat bloky',
				'type'    => 'server',
				'dataDep' => false,
			),
		);
	}

	/**
	 * Module viewConfiguration
	 *
	 * @return array
	 */
	public function viewConfiguration()
	{
		return array(
			'type' => 'WebBuilder.module.BlockManager.BlocksList',
			'loadAction' => 'loadListData',

			'barActions' => array(
				'createCategory',
				'generateBlocks'
			),

			'fields' => array(
				'title' => array(
					'type'  => 'treecolumn',
					'title' => 'Název'
				),

				'actions' => array(
					'type'  => 'actioncolumn',
					'items' => array( 'editCategory', 'deleteCategory' )
				)
			),
		);
	}

	/**
	 * Loads data for dataList
	 *
	 * @param  RequestInterface $request
	 * @return DataBrowserResponse
	 */
	public function loadListData( RequestInterface $request )
	{
		$request = new DataRequestDecorator( $request );

		$categoriesFeeder = new cDBFeederBase( 'WebBuilder\\DataObjects\\BlocksCategory', $this->database );
		$categories       = $categoriesFeeder->get();

		// add 'uncategorized' category
		$categories[] = new BlocksCategory( array(
			'title' => 'Nezařazené'
		) );

		$blocksFeeder = new cDBFeederBase( 'WebBuilder\\DataObjects\\Block', $this->database );
		$blocks       = $blocksFeeder->groupBy( 'category_ID' )->get();

		$extractor = function( BlocksCategory $category ) use ( $blocks ) {
			$categoryID = $category->getID();

			$blocksData = array();
			if( isset( $blocks[ $categoryID ] ) && false ) {
				foreach( $blocks[ $categoryID ] as $block ) {
					/* @var $block Block */
					$blocksData[] = array(
						'ID'     => $block->getID(),
						'title'  => $block->getTitle(),
					);
				}
			}

			return array(
				'ID'     => $categoryID,
				'title'  => $category->getTitle(),
				'blocks' => $blocksData,
			);
		};

		return new DataBrowserResponse( true, $categories ?: array(), 0, $extractor );
	}

	/**
	 * Deletes blocks category
	 *
	 * @param  RequestInterface $request
	 * @return Response
	 */
	public function deleteCategory( RequestInterface $request )
	{
		// FIXME safe-input here!!!
		$categoryIDs = $request->getRawParameter( 'recordIDs' );

		$categoriesFeeder = new cDBFeederBase( 'WebBuilder\\DataObjects\\BlocksCategory', $this->database );
		$categoriesFeeder->whereColumnIn( 'ID', $categoryIDs )->remove();

		return new ActionResponse( true );
	}

	/**
	 * Rebuilds available blocks list
	 *
	 * @param  RequestInterface $request
	 * @return Response
	 */
	public function generateBlocks( RequestInterface $request )
	{
		return new ActionResponse( true );
	}
}