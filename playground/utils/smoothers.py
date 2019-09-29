import numpy as np
import tqdm
from scipy.special import factorial

def exp_smooth(data_array, horizons,
               deriv_count=1, time_axis=0,
               target=0.8, coef_scaler='factorial',
               tqdm_on=False, error=False):
    if type(horizons) is int: horizons = np.array([horizons])
    else: horizons = np.array(horizons)

    coefs = np.tile((1 - ((1-target)**(1/horizons)))[:, np.newaxis], (deriv_count+1))
    if coef_scaler == 'factorial': coefs /= factorial(np.arange(1, deriv_count+2))[np.newaxis, :]
    elif coef_scaler == 'exponential': coefs = coefs ** np.arange(1, deriv_count+2)[np.newaxis, :]
    elif coef_scaler == 'exp_run': coefs[1:] = coefs[:, 1:] ** 2
    elif coef_scaler == 'exp_sqrt': coefs = coefs ** np.sqrt(np.arange(1, deriv_count+2))[np.newaxis, :]
    elif coef_scaler == 'none': pass
    else: raise Exception('coef_scaler of %s is invalid.' % coef_scaler)

    agg = []
    for d in range(deriv_count+1):
        agg.append(np.pad(1 / factorial(np.arange(deriv_count-d+1)), (d, 0), 'constant', constant_values=0))
    agg = np.stack(agg, axis=1)

    smooth_data = [np.concatenate([
        np.expand_dims(np.tile(np.expand_dims(np.take(data_array, 0, axis=time_axis), -1), horizons.size), -1),
        np.zeros(list(data_array.shape[1:]) + [horizons.size, deriv_count])
    ], axis=-1)]

    if error:
        error_data = []
        var_data = []

    t = tqdm.tnrange(1, data_array.shape[time_axis], leave=False) if tqdm_on else range(1, data_array.shape[time_axis])
    for i in t:
        steps = np.einsum('...i,ij->...j', smooth_data[-1], agg)
        new_smooth = []
        for d in range(deriv_count+1):
            step_deriv = np.take(steps, d, axis=-1)
            if d == 0:
                vals = np.tile(np.expand_dims(np.take(data_array, i, axis=time_axis), -1), horizons.size)
                if error:
                    error_vals = step_deriv - vals

                    if len(error_data) == 0: error_data.append(error_vals)
                    error_smooth = np.einsum('...i,i->...i', error_vals, coefs[:,d]) + np.einsum('...i,i->...i', error_data[-1], (1-coefs[:,d]))
                    error_data.append(error_smooth)

                    if len(var_data) == 0: var_data.append(error_vals**2)
                    var_smooth = np.einsum('...i,i->...i', error_vals**2, coefs[:,d]) + np.einsum('...i,i->...i', var_data[-1], (1-coefs[:,d]))
                    var_data.append(var_smooth)
            else:
                vals = (new_smooth[-1] - np.take(smooth_data[-1], d-1, axis=-1))

            smooth_vals = np.einsum('...i,i->...i', vals, coefs[:,d]) + np.einsum('...i,i->...i', step_deriv, (1-coefs[:,d]))
            new_smooth.append(smooth_vals)
        new_smooth = np.stack(new_smooth, -1)
        smooth_data.append(new_smooth)
    smooth_data = np.stack(smooth_data, time_axis)

    if error:
        error_data = np.stack(error_data, time_axis)
        var_data = np.stack(var_data, time_axis)
        smooth_data = np.concatenate([smooth_data, np.expand_dims(error_data, -1), np.expand_dims(var_data, -1)], -1)
        
    return smooth_data