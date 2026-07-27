import { createSlice } from "@reduxjs/toolkit";
import { InstitutionConfig } from "@/types/institutionConfig";
import { fetchInstitutionConfig, updateInstitutionConfig } from "../service/institutionConfigService";

// Constancia de Calificaciones backend-driven config (PLAN_FEATURES 4.4
// polish). `loading` covers the read thunk, `saving` covers the write thunk
// separately so the configurator page can disable only the Save button
// while a background refetch happens (mirrors gradeSlice/paymentSlice's
// per-thunk status split, but named explicitly here since there are only
// two thunks total).
const institutionConfigSlice = createSlice({
  name: "institutionConfig",
  initialState: {
    config: null as InstitutionConfig | null,
    loading: false,
    saving: false,
    errorMessage: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInstitutionConfig.pending, (state) => {
        state.loading = true;
        state.errorMessage = null;
      })
      .addCase(fetchInstitutionConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.config = action.payload.data;
        state.errorMessage = null;
      })
      .addCase(fetchInstitutionConfig.rejected, (state, action) => {
        state.loading = false;
        state.errorMessage = action.payload ?? "No se pudo cargar la configuración de la institución";
      })
      .addCase(updateInstitutionConfig.pending, (state) => {
        state.saving = true;
        state.errorMessage = null;
      })
      .addCase(updateInstitutionConfig.fulfilled, (state, action) => {
        state.saving = false;
        state.config = action.payload.data;
        state.errorMessage = null;
      })
      .addCase(updateInstitutionConfig.rejected, (state, action) => {
        state.saving = false;
        state.errorMessage = action.payload ?? "No se pudo guardar la configuración de la institución";
      });
  }
});

export const institutionConfigSliceReducer = institutionConfigSlice.reducer;
