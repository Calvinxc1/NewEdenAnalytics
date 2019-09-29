import pandas as pd
import numpy as np
import tqdm

def exp_smooth(working_data, horizon,
               target=0.8, beta_exp=2,
               alpha_override=None, beta_override=None,
               error_adjust=False, verbose=False
              ):
    alpha = 1-((1-0.95)**(1/horizon)) if alpha_override is None else alpha_override
    beta = alpha**beta_exp if beta_override is None else beta_override
    
    smoothed_data = {
        'level': [working_data.iloc[0,:]],
        'trend': [pd.Series(0, index=working_data.columns, name=working_data.index[0])],
        'error': [pd.Series(0, index=working_data.columns, name=working_data.index[0])],
        'var': [pd.Series(0, index=working_data.columns, name=working_data.index[0])]
    }
    
    t = working_data.iloc[1:,:].iterrows()
    if verbose: t = tqdm.tqdm_notebook(t, total=len(working_data)-1, leave=False)

    for date, vals in t:
        if error_adjust:
            new_level = (
                alpha * vals
            ) + (
                (1-alpha) * (smoothed_data['level'][-1] + (
                    (smoothed_data['trend'][-1] + smoothed_data['error'][-1])/2
                ))
            )
        else:
            new_level = (
                alpha * vals
            ) + (
                (1-alpha) * (smoothed_data['level'][-1] + smoothed_data['trend'][-1])
            )
        
        new_trend = (beta * (new_level - smoothed_data['level'][-1])) + ((1-beta) * smoothed_data['trend'][-1])
        
        error = vals - new_level
        new_error = (beta * error) + ((1-beta) * smoothed_data['error'][-1])
        new_var = (beta * (error**2)) + ((1-beta) * smoothed_data['var'][-1])
        
        smoothed_data['level'].append(new_level)
        smoothed_data['trend'].append(new_trend)
        smoothed_data['error'].append(new_error)
        smoothed_data['var'].append(new_var)

        for val in smoothed_data.values(): val[-1].name = date

    for key, val in smoothed_data.items(): smoothed_data[key] = pd.concat(val, axis=1).T
        
    return smoothed_data

def exp_smooth_a(working_data, horizon, target=0.8, beta_exp=2, alpha_override=None, beta_override=None):
    alpha = 1-((1-target)**(1/horizon)) if alpha_override is None else alpha_override
    beta = alpha ** beta_exp if beta_override is None else beta_override
    
    alpha_grid = [
        np.pad(alpha * ((1-alpha) ** np.arange(i-1, -1, -1)), (0, len(working_data) - i - 1), 'constant', constant_values=0)
        for i in range(len(working_data))
    ]
    alpha_grid = pd.DataFrame(
        np.stack(alpha_grid, axis=0),
        index=working_data.index, columns=working_data.index[1:]
    )
    alpha_grid.insert(0, working_data.index[0], 1-alpha_grid.sum(axis=1))
    
    beta_grid = [
        np.pad(beta * ((1-beta) ** np.arange(i-1, -1, -1)), (0, len(working_data) - i - 1), 'constant', constant_values=0)
        for i in range(len(working_data))
    ]
    beta_grid = pd.DataFrame(
        np.stack(beta_grid, axis=0),
        index=working_data.index, columns=working_data.index[1:]
    )
    beta_grid.insert(0, working_data.index[0], 1-beta_grid.sum(axis=1))
    
    data = {'level': alpha_grid @ working_data}
    data['trend'] = beta_grid @ data['level'].diff(1).fillna(0)
    data['error'] = working_data - data['level']
    
    return data

def market_smoother(data_matrix, horizon,
                    target=0.8, beta_exp=2,
                    alpha_override=None, beta_override=None,
                    verbose=False
                   ):
    alpha = 1-((1-target)**(1/horizon)) if alpha_override is None else alpha_override
    beta = alpha**beta_exp if beta_override is None else beta_override
    
    smooth_data = {
        'level': [data_matrix[0,:,:,:]],
        'trend': [np.zeros(data_matrix.shape[1:])],
        'error': [np.zeros(data_matrix.shape[1:])],
        'var': [np.zeros(data_matrix.shape[1:])]
    }
    
    t = data_matrix[1:,:,:,:]
    if verbose: t = tqdm.tqdm_notebook(t, leave=False)
    
    for row in t:
        new = {'level': (alpha * row) + ((1-alpha) * (smooth_data['level'][-1] + smooth_data['trend'][-1]))}
        new['trend'] = (beta * (new['level'] - smooth_data['level'][-1])) + ((1-beta) * smooth_data['trend'][-1])
        new['error'] = (beta * (new['level'] - row)) + ((1-beta) * smooth_data['error'][-1])
        new['var'] = (beta * ((new['level'] - row)**2)) + ((1-beta) * smooth_data['var'][-1])

        for key, val in smooth_data.items():
            val.append(new[key])
            
    for key, val in smooth_data.items():
        smooth_data[key] = np.stack(smooth_data[key], axis=0)
        
    return smooth_data