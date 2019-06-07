namespace $ {

	export function $mol_mem<
		Host extends object ,
		Field extends keyof Host ,
		Value ,
	>(
		proto : Host ,
		name : Field ,
		descr? : TypedPropertyDescriptor< ( next? : Value , force? : $mol_mem_force )=> Value >
	) : any {

		const value = descr!.value!
		
		const store = new WeakMap< Host , $mol_atom2< Value > >()

		Object.defineProperty( proto , name + "()" , {
			get : function() {
				return store.get( this )
			}
		} )

		const get_cache = ( host : Host )=> {
			
			let cache = store.get( host )
			if( cache ) return cache

			let cache2 = new $mol_atom2
			cache2.calculate = value.bind( host )
			cache2[ Symbol.toStringTag ] = `${ host }.${ name }()`
			cache2.abort = ()=> {
				store.delete( host )
				cache2.forget()
				return true
			}
			$mol_owning_catch( host , cache2 )
			cache2[ $mol_object_field ] = name
			store.set( host , cache2 )

			return cache2
		}
		
		return {
			
			value( next? : Value , force? : $mol_mem_force ) {
				
				if( next === undefined ) {
					const cache = get_cache( this )
					if( force === $mol_mem_force_cache ) cache.obsolete()
					return cache.get()
				}
				
				const slave = $mol_fiber.current
				let master = slave && slave.master as $mol_fiber< void >
				if( !master ) {
					
					master = new $mol_fiber
					master.calculate = ()=> {
						if( force !== $mol_mem_force_cache ) next = value.call( this , next )
						return get_cache( this ).put( next )
					}
					master[ Symbol.toStringTag ] = `${ this }.${ name }()/set`
				}

				return master.get()

			}

		}

	}
	
}
