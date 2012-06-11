<?php
namespace WebBuilder\Administration\TemplateManager;

use ExtAdmin\Response\DataStoreResponse;

use WebBuilder\Persistance\DatabaseDeleter;

use ExtAdmin\Request\AbstractRequest;

use ExtAdmin\Response\ActionResponse;

use ExtAdmin\Module\DataBrowser\GridList;
use WebBuilder\DataObjects\BlockSet;
use ExtAdmin\Request\DataRequestDecorator;
use ExtAdmin\Response\DataBrowserResponse;
use ExtAdmin\RequestInterface;
use Inspirio\Database\cDBFeederBase;
use Inspirio\Database\cDatabase;

class TemplateList extends GridList
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

			'createEmpty' => array(
				'title'   => 'Vytvořit prázdnou',
				'type'    => 'create',
				'params'  => array(
					'editor'      => 'TemplateEditor',
					'loadDefault' => 'loadData_new'
				),
			),

			'createCopy' => array(
				'title'   => 'Vytvořit kopii',
				'iconCls' => 'i-page-white-copy',
				'type'    => 'create',
				'dataDep' => true,
				'params'  => array(
					'editor'      => 'TemplateEditor',
					'loadDefault' => 'loadData_copy'
				),
			),

			'createInherited' => array(
				'title'   => 'Vytvořit poděděnou',
				'iconCls' => 'i-page-white-go',
				'type'    => 'create',
				'dataDep' => true,
				'params'  => array(
					'editor'      => 'TemplateEditor',
					'loadDefault' => 'loadData_inherited'
				),
			),

			'edit' => array(
				'title'  => 'Upravit',
				'type'   => 'edit',
				'params' => array(
					'editor'      => 'TemplateEditor',
					'loadDefault' => 'loadData_record'
				),
			),

			'delete' => array(
				'title'   => 'Smazat',
				'type'    => 'delete',
// 				'enabled' => function( BlockSet $record ) {
// 					return ( $record->getID() % 2 ) == 0;
// 				}
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
			'barActions' => array(
				array(
					'type'  => 'splitButton',
					'title' => 'Založit novou',
					'items' => array( 'createEmpty', 'createCopy', 'createInherited' )
				),
				'edit',
				'delete'
			),

			'filters' => array(
				'items' => array(
					'title'         => array( 'fieldLabel' => 'Název', 'xtype' => 'textfield' ),
					'pageTemplates' => array( 'fieldLabel' => 'Zobrazit šablony stránek', 'xtype' => 'checkbox' ),
				)
			),

			'fields' => array(
				'title' => array(
					'title' => 'Název'
				),

				'webPageCount' => array(
					'title'    => '# webových stránek',
					'width'    => 120,
					'sortable' => false
				),

				'inheritedCount' => array(
					'title'    => '# poděděných šablon',
					'width'    => 120,
					'sortable' => false
				),

				'action' => array(
					'type'  => 'actioncolumn',
					'items' => array( 'createCopy', 'createInherited', 'edit', 'delete' )
				)
			),
		);
	}

	/**
	 * Applies filters from the request on the data feeder
	 *
	 * @param DataRequestDecorator $request
	 * @param cDBFeederBase $feeder
	 * @return cDBFeederBase
	 */
	private function applyRequestFilters( DataRequestDecorator $request, cDBFeederBase $feeder )
	{
		if( $request->hasFilter( 'title' ) ) {
			$feeder->whereColumnLike( 'name', '%'. $request->getFilter( 'title', 'string' ) .'%' );
		}

		if( ! $request->hasFilter( 'pageTemplates') ) {
			$feeder->where( 'ID NOT IN ( SELECT block_set_ID FROM web_pages WHERE block_set_ID IS NOT NULL )' );
		}

		return $feeder;
	}

	/**
	 * Applies result sorting from the request on the data feeder
	 *
	 * @param DataRequestDecorator $request
	 * @param cDBFeederBase $feeder
	 * @return cDBFeederBase
	 */
	private function applyRequestSorting( DataRequestDecorator $request, cDBFeederBase $feeder )
	{
		foreach( $request->getOrdering() as $property => $dir ) {
			switch( $property ) {
				case 'title': $feeder->orderBy( 'name', $dir ); break;
			}
		}

		return $feeder;
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

		$dataFeeder = new cDBFeederBase( '\\WebBuilder\\DataObjects\\BlockSet', $this->database );

		$this->applyRequestFilters( $request, $dataFeeder );
		$this->applyRequestSorting( $request, $dataFeeder );
		$data = $dataFeeder->indexBy( 'ID' )->get();

		$count = $this->applyRequestFilters( $request, $dataFeeder )->getCount();

		if( $data === null ) {
			$data = array();

			$inheritedCount = null;
			$webPageCount   = null;

		} else {
			$blockSetIDs = array_keys( $data );
			$deleter     = new DatabaseDeleter( $this->database );

			$inheritedCount = $deleter->getInheritedBlockSetCount( $blockSetIDs );
			$webPageCount   = $deleter->getWebPageUsageCount( $blockSetIDs );
		}

		return new DataStoreResponse( true, $data, $count, function( BlockSet $record ) use( $inheritedCount, $webPageCount ) {
			$ID        = $record->getID();
			$inherited = 0;
			$webPages  = 0;
			$action    = array( 'edit' );

			if( isset( $inheritedCount[ $ID ] ) ) {
				$inherited = $inheritedCount[ $ID ];
			}

			if( isset( $webPageCount[ $ID ] ) ) {
				$webPages = $webPageCount[ $ID ];
			}

			if( $webPages == 0 ) {
				$action[] = 'createCopy';
				$action[] = 'createInherited';

				if( $inherited == 0 ) {
					$action[] = 'delete';
				}
			}

			return array(
				'ID'    => $record->getID(),
				'title' => $record->getName(),
				'inheritedCount' => $inherited,
				'webPageCount'   => $webPages,
				'action'         => $action,
			);
		} );
	}

	/**
	 * Deletes the records
	 *
	 * @param RequestInterface $request
	 * @return ActionResponse
	 */
	public function delete( RequestInterface $request )
	{
		$recordIDs = array();
		$records   = $request->getRawData( 'records' );

		if( is_array( $records ) ) {
			foreach( $records as $record ) {
				$recordID = AbstractRequest::secureData( $record, 'ID', 'int' );

				if( $recordID ) {
					$recordIDs[] = $recordID;
				}
			}
		}

		try {
			$this->database->transactionStart();

			$deleter = new DatabaseDeleter( $this->database );
			$deleter->deleteBlockInstances( $recordIDs );

			$this->database->transactionCommit();

		} catch( Exception $e ) {
			$this->database->transactionRollback();
			throw $e;
		}

		return new ActionResponse( true );
	}
}