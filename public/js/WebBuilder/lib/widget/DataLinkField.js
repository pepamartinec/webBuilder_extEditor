Ext.define( 'WebBuilder.widget.DataLinkField', {
	extend : 'Ext.form.field.Display',

	valueToRaw : function( value )
	{
		return value.getProvider().block.get('title') +'::'+ value.getProperty() +'('+ value.getValue() +')';
	}
});