import { createContext, useContext, useReducer } from 'react';
import { demoData } from './damo-data';
import { Context, ContextChange, ContextDelta } from './defs';
import { parseBlockTransfers } from './helpers';


const AppContext = createContext(null);
const AppDispatchContext = createContext(null);

export function AppContextProvider({ children }) {

    // debog
    const ic = JSON.parse(demoData);
    console.log(ic);

    const [context, dispatch] = useReducer(
        contextReducer,
        // initialContext
        ic
    );
  
    return (
      <AppContext.Provider value={context}>
        <AppDispatchContext.Provider value={dispatch}>
          {children}
        </AppDispatchContext.Provider>
      </AppContext.Provider>
    );
}

export function useAppContext() {
    return useContext(AppContext);
}
  
export function useAppDispatch() {
    return useContext(AppDispatchContext);
}
  

function contextReducer(appContext, action) {
    // console.log(appContext, '-->');
    const newContext = _contextReducer(appContext, action);
    // console.log('-->', newContext);
    return newContext;
}


function appendBlock(context: Context, action: ContextDelta): Context {
   
    console.log('[Context] append block', action.newBlock);

    const lastBlock = context.blocks.length > 0 ? 
        context.blocks[context.blocks.length - 1].block_number : 
        -1;
    if (action.newBlock.block_number <= lastBlock) {
        console.log('duplicated block Number! last block = ', lastBlock, 'new block = ', action.newBlock);
        return context;
    }

    context.blocks = [
        ...context.blocks,
        parseBlockTransfers(action.newBlock),
    ];
    return context;
}

function popFirstBlock(context: Context): Context {
    if (context.blocks.length == 0) {
        return context;
    }

    console.log('[Context] pop first block');

    // note, this won't create a new array and therefore react would think there is no change, 
    // in turn, re-render won't happen which is the desired behavior 
    context.blocks.shift();
    return context; 
}


function _contextReducer(context: Context, action: ContextDelta) {
    switch (action.type) {
        case ContextChange.APPEND_BLOCK: {
            return appendBlock(context, action);
        }
        case ContextChange.POP_FIRST_BLOCK: {
            return popFirstBlock(context);
        }
    }
}
  
const initialContext = {
    blocks: [],
};

