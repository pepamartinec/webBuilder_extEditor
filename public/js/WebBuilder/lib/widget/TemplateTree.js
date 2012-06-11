Ext.define( 'WebBuilder.widget.TemplateTree',
{
	extend : 'Ext.tree.Panel',
	
	requires : [
		'Ext.tree.Column',
		'Ext.dd.DropZone'
	],
	
	/**
	 * @cfg {String} ddGroup
	 */
	ddGroup : undefined,
	
	/**
	 * @property {Ext.data.TreeStore} store
	 */
	store : null,
	
	initComponent : function()
	{
		var me = this;
//		
//		me.store = Ext.create( 'Ext.data.Store', {
//			model : me.$className +'.ItemModel',
//			
//			proxy : {
//				type   : 'memory',
//				reader : 'json'
//			}
//		});
		
		Ext.apply( me, {
			rootVisible: true,
			
			columns : [{
				xtype     : 'treecolumn',
				header    : 'Blok',
				dataIndex : 'template',
				renderer  : function( template, metda, record ) {
					if( template ) {
						return template.get('filename');
						
					} else if( record.root ) {
						return '--';
						
					} else {
						return 'MISSING BLOCK';
					}
				}
			}],
			
	        viewConfig: {
	            plugins: {
	                ptype      : 'treeviewdragdrop',
	                ddGroup    : me.ddGroup,
	                appendOnly : true
	            },
	            
                listeners : {
                	beforedrop : function( node, data ) {
                		var dataCopy = [];
                		
                		Ext.Array.forEach( data.records, function( block ) {
                			var instanceSlots = [];
                			
                			block.slots.each( function( slot ) {
                				instanceSlots.push({
                					isSlot : true,
                					record : slot
                				});
                			});
                			
                			var instance = me.store.getProxy().getReader().read({
                				isBlock  : true,
                				record   : record,
                				children : slots
                			});
                			
                			dataCopy.push( instance );
                		});
                		
                		data.records = dataCopy;
                	}
                }
	        }
		});
		
		me.callParent();
	}

}, function() {
	
	Ext.define( this.$className +'.ItemModel', {
		extend : 'Ext.data.Model',
		
		fields : [{
			name : 'isBlock',
			type : 'bool'
		},{
			name : 'isSlot',
			type : 'bool'
		}]
	});
});