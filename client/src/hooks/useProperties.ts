import { usePropertyStore } from '../store/propertyStore'

/**
 * Custom hook to access property state and actions
 */
export const useProperties = () => {
  const {
    // State
    properties,
    totalProperties,
    currentPage,
    totalPages,
    hasMore,
    myProperties,
    myPropertiesTotal,
    statistics,
    currentProperty,
    isLoading,
    isUploadingImages,
    error,

    // Actions
    fetchProperties,
    searchProperties,
    fetchPropertyById,
    fetchMyProperties,
    fetchMyStatistics,
    createProperty,
    updateProperty,
    deleteProperty,
    changePropertyStatus,
    publishProperty,
    markAsOccupied,
    uploadImages,
    contactProperty,
    setCurrentProperty,
    clearProperties,
    setError,
  } = usePropertyStore()

  return {
    // State
    properties,
    totalProperties,
    currentPage,
    totalPages,
    hasMore,
    myProperties,
    myPropertiesTotal,
    statistics,
    currentProperty,
    isLoading,
    isUploadingImages,
    error,

    // Actions
    fetchProperties,
    searchProperties,
    fetchPropertyById,
    fetchMyProperties,
    fetchMyStatistics,
    createProperty,
    updateProperty,
    deleteProperty,
    changePropertyStatus,
    publishProperty,
    markAsOccupied,
    uploadImages,
    contactProperty,
    setCurrentProperty,
    clearProperties,
    setError,
  }
}
