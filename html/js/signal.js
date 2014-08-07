var Signal = function()
{
    this.m_Listeners = [];
};

Signal.prototype = {
    Raise: function( data ) {

        for( var index = 0; index < this.m_Listeners.length; ++index )
        {
            listener = this.m_Listeners[ index ];
            listener( data );
        }

    },

    AddListener: function( listener )
    {
        if ( this.m_Listeners.indexOf( listener ) == -1 )
        {
            this.m_Listeners.push( listener );
        }
    },

    RemoveListener: function( listener )
    {
        var index = this.m_Listeners.indexOf( listener );
        if( idx != -1 )
        {
            this.m_Listeners.splice( index, 1 );
        }
    },

    ClearListeners: function()
    {
        this.m_Listeners = [];
    }
};