import tc from 'tinycolor2'
import { useState, useEffect } from 'react'
import { rgb2cmyk } from '../utils/converters.js'
import { ColorsProps, GradientProps, Config } from '../shared/types.js'
import { isUpperCase, getDetails, getColorObj } from '../utils/utils.js'
import { low, high, getColors, formatInputValues } from '../utils/formatters.js'

export const useColorPicker = (
  value: string,
  onChange: (arg0: string) => void,
  config?: Config
) => {
  const {
    defaultColor = 'rgba(175, 51, 242, 1)',
    defaultGradient = 'linear-gradient(90deg, rgba(2,0,36,1) 0%, rgba(9,9,121,1) 35%, rgba(0,212,255,1) 100%)',
  } = config ?? {}

  let colors = getColors(value, defaultColor, defaultGradient)
  const { degrees, degreeStr, isGradient, gradientType } = getDetails(value)
  const { currentColor, selectedColor, currentLeft } = getColorObj(
    colors,
    defaultGradient
  )
  const [previousColors, setPreviousColors] = useState([])

  const getGradientObject = (currentValue: string) => {
    if (currentValue) {
      colors = getColors(currentValue, defaultColor, defaultGradient)
    }
    if (value) {
      if (isGradient) {
        return {
          isGradient: true,
          gradientType: gradientType,
          degrees: degreeStr,
          colors: colors?.map((c: ColorsProps) => ({
            ...c,
            value: c.value?.toLowerCase(),
          })),
        }
      } else {
        return {
          isGradient: false,
          gradientType: null,
          degrees: null,
          colors: colors?.map((c: ColorsProps) => ({
            ...c,
            value: c.value?.toLowerCase(),
          })),
        }
      }
    } else {
      console.log(
        'RBGCP ERROR - YOU MUST PASS A VALUE AND CALLBACK TO THE useColorPicker HOOK'
      )
    }
  }

  const tiny = tc(currentColor)
  const { r, g, b, a } = tiny.toRgb()
  const { h, s, l } = tiny.toHsl()

  useEffect(() => {
    if (tc(currentColor)?.isValid() && previousColors[0] !== currentColor) {
      // @ts-expect-error - currentColor type issue
      setPreviousColors([currentColor, ...previousColors.slice(0, 19)])
    }
  }, [currentColor, previousColors])

  const setLinear = () => {
    const remaining = value.split(/,(.+)/)[1]
    onChange(`linear-gradient(90deg, ${remaining}`)
  }

  const setRadial = () => {
    const remaining = value.split(/,(.+)/)[1]
    onChange(`radial-gradient(circle, ${remaining}`)
  }

  const setDegrees = (newDegrees: number) => {
    const remaining = value.split(/,(.+)/)[1]
    onChange(
      `linear-gradient(${formatInputValues(
        newDegrees,
        0,
        360
      )}deg, ${remaining}`
    )
    if (gradientType !== 'linear-gradient') {
      console.log(
        'Warning: you are updating degrees when the gradient type is not linear. This will change the gradients type which may be undesired'
      )
    }
  }

  const setSolid = (startingColor: string) => {
    const newValue = startingColor ?? defaultColor ?? 'rgba(175, 51, 242, 1)'
    onChange(newValue)
  }

  const setGradient = (startingGradiant: string) => {
    const newValue =
      startingGradiant ??
      defaultGradient ??
      'linear-gradient(90deg, rgba(2,0,36,1) 0%, rgba(9,9,121,1) 35%, rgba(0,212,255,1) 100%)'
    onChange(newValue)
  }

  const createGradientStr = (newColors: GradientProps[]) => {
    const sorted = newColors.sort(
      (a: GradientProps, b: GradientProps) => a.left - b.left
    )
    const colorString = sorted?.map(
      (cc: ColorsProps) => `${cc?.value} ${cc.left}%`
    )
    onChange(`${gradientType}(${degreeStr}, ${colorString.join(', ')})`)
  }

  const handleGradient = (newColor: string, left?: number) => {
    const remaining = colors?.filter((c: ColorsProps) => !isUpperCase(c.value))
    const newColors = [
      { value: newColor.toUpperCase(), left: left ?? currentLeft },
      ...remaining,
    ]
    createGradientStr(newColors)
  }

  const handleChange = (newColor: string) => {
    newColor = newColor?.replace(/\s+/g, '')
    if (isGradient) {
      handleGradient(newColor)
    } else {
      onChange(newColor)
    }
  }

  const setR = (newR: number) => {
    const newVal = formatInputValues(newR, 0, 255)
    handleChange(`rgba(${newVal}, ${g}, ${b}, ${a})`)
  }

  const setG = (newG: number) => {
    const newVal = formatInputValues(newG, 0, 255)
    handleChange(`rgba(${r}, ${newVal}, ${b}, ${a})`)
  }

  const setB = (newB: number) => {
    const newVal = formatInputValues(newB, 0, 255)
    handleChange(`rgba(${r}, ${g}, ${newVal}, ${a})`)
  }

  const setA = (newA: number) => {
    const newVal = formatInputValues(newA, 0, 100)
    handleChange(`rgba(${r}, ${g}, ${b}, ${newVal / 100})`)
  }

  const setHue = (newHue: number) => {
    const newVal = formatInputValues(newHue, 0, 360)
    const tinyNew = tc({ h: newVal, s: s, l: l })
    const { r, g, b } = tinyNew.toRgb()
    handleChange(`rgba(${r}, ${g}, ${b}, ${a})`)
  }

  const setSaturation = (newSat: number) => {
    const newVal = formatInputValues(newSat, 0, 100)
    const tinyNew = tc({ h: h, s: newVal / 100, l: l })
    const { r, g, b } = tinyNew.toRgb()
    handleChange(`rgba(${r}, ${g}, ${b}, ${a})`)
  }

  const setLightness = (newLight: number) => {
    const newVal = formatInputValues(newLight, 0, 100)
    const tinyNew = tc({ h: h, s: s, l: newVal / 100 })
    if (tinyNew?.isValid()) {
      const { r, g, b } = tinyNew.toRgb()
      handleChange(`rgba(${r}, ${g}, ${b}, ${a})`)
    } else {
      console.log(
        'The new color was invalid, perhaps the lightness you passed in was a decimal? Please pass the new value between 0 - 100'
      )
    }
  }

  const valueToHSL = () => {
    return tiny.toHslString()
  }

  const valueToHSV = () => {
    return tiny.toHsvString()
  }

  const valueToHex = () => {
    return tiny.toHexString()
  }

  const valueToCmyk = () => {
    const { c, m, y, k } = rgb2cmyk(r, g, b)
    return `cmyk(${c}, ${m}, ${y}, ${k})`
  }

  const setSelectedPoint = (index: number) => {
    if (isGradient) {
      const newGradStr = colors?.map((cc: GradientProps, i: number) => ({
        ...cc,
        value: i === index ? high(cc) : low(cc),
      }))
      createGradientStr(newGradStr)
    } else {
      console.log(
        'This function is only relevant when the picker is in gradient mode'
      )
    }
  }

  const addPoint = (left: number) => {
    const newColors = [
      ...colors.map((c: GradientProps) => ({ ...c, value: low(c) })),
      { value: currentColor, left: left },
    ]
    createGradientStr(newColors)
    if (!left) {
      console.log(
        'You did not pass a stop value (left amount) for the new color point so it defaulted to 50'
      )
    }
  }

  const deletePoint = (index: number) => {
    if (colors?.length > 2) {
      const pointToDelete = index ?? selectedColor
      const remaining = colors?.filter(
        (rc: ColorsProps, i: number) => i !== pointToDelete
      )
      createGradientStr(remaining)
      if (!index) {
        console.log(
          'You did not pass in the index of the point you wanted to delete so the function default to the currently selected point'
        )
      }
    } else {
      console.log(
        'A gradient must have atleast two colors, disable your delete button when necessary'
      )
    }
  }

  const setPointLeft = (left: number) => {
    handleGradient(currentColor, formatInputValues(left, 0, 100))
  }

  const rgbaArr = [r, g, b, a]
  const hslArr = [h, s, l]

  return {
    setR,
    setG,
    setB,
    setA,
    setHue,
    addPoint,
    setSolid,
    setLinear,
    setRadial,
    valueToHSL,
    valueToHSV,
    valueToHex,
    valueToCmyk,
    setDegrees,
    setGradient,
    setLightness,
    setSaturation,
    setSelectedPoint,
    deletePoint,
    isGradient,
    gradientType,
    degrees,
    setPointLeft,
    currentLeft,
    rgbaArr,
    hslArr,
    handleChange,
    previousColors,
    getGradientObject,
    selectedPoint: selectedColor,
  }
}
