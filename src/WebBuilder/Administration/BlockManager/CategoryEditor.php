<?php
namespace WebBuilder\Administration\BlockManager;

use WebBuilder\DataObjects\BlocksCategory;

use ExtAdmin\RequestInterface;
use ExtAdmin\Response\ActionResponse;
use Inspirio\Database\cDBFeederBase;
use ExtAdmin\ResponseInterface;
use Inspirio\Database\cDatabase;
use ExtAdmin\Module\DataEditor\DataEditor;

class CategoryEditor extends DataEditor
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
	 * Module constructor
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
	 * Returns module actions definition
	 *
	 * Used for defining actions within concrete modules implementations
	 *
	 * @return array
	 */
	protected function actions()
	{
		return array(
			'loadData_new'       => true,
			'loadData_record'    => true,

			'saveData' => array(
				'type' => 'save'
			),

			'cancel' => array(
				'type' => 'cancel'
			),
		);
	}

	/**
	 * Module view configuration
	 *
	 * @return array
	 */
	public function viewConfiguration()
	{
		return array(
			'type'       => 'WebBuilder.module.BlockManager.CategoryEditor',
			'loadAction' => 'loadData_record',
			'saveAction' => 'saveData',

			'buttons' => array(
				array(
					'type'   => 'button',
					'text'   => 'Uložit',
					'action' => 'saveData'
				),

				array(
					'type'   => 'button',
					'text'   => 'Storno',
					'action' => 'cancel'
				)
			)
		);
	}

	/**
	 * Loads data for new category
	 *
	 * @param  RequestInterface $request
	 * @return Response
	 */
	public function loadData_new( RequestInterface $request )
	{
		return new ActionResponse( true );
	}

	/**
	 * Loads data for existing category
	 *
	 * @param  RequestInterface $request
	 * @return Response
	 */
	public function loadData_record( RequestInterface $request )
	{
		$categoryID = $request->getData( 'ID', 'int' );
		$response   = new ActionResponse( true );

		// load template
		/* @var $category BlocksCatergory */
		$category = null;

		if( $categoryID != null ) {
			$categoriesFeeder = new cDBFeederBase( '\\WebBuilder\\DataObjects\\BlocksCategory', $this->database );
			$category         = $categoriesFeeder->whereID( $categoryID )->getOne();
		}

		if( $category === null ) {
			$response->setSuccess( false )
			         ->setMessage( 'Category not found' );

		} else {
			$response->setData( $category->getInnerValues() );
		}

		return $response;
	}

	/**
	 * Saves submitted category data
	 *
	 * @param RequestInterface $request
	 * @return DataStoreResponse
	 */
	public function saveData( RequestInterface $request )
	{
		$category = new BlocksCategory( array(
			'ID'    => $request->getData( 'ID', 'int' ),
			'title' => $request->getData( 'title', 'string' )
		) );

		$categoriesFeeder = new cDBFeederBase( '\\WebBuilder\\DataObjects\\BlocksCategory', $this->database );
		$categoriesFeeder->save( $category );

		$category = $categoriesFeeder->whereID( $category->getID() )->getOne();

		if( $category ) {
			$response = new ActionResponse( true );
			$response->setData( $category->getInnerValues() );

		} else {
			$response = new ActionResponse( false );
		}

		return $response;
	}
}