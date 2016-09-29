import { EventEmitter } from 'events'

/**
 * Param
 * Containing property and value that can be changed over time
 *
 * @fires Param#change
 * @fires Param#change:prop
 * @fires Param#change:value
 * @fires List#change
 * @fires List#change:prop
 * @fires List#change:value
 */
class Param extends EventEmitter {

  _prop = null
  _value = null
  _list = null

  mappings = []

  constructor(prop, value) {
    super()

    this.setMaxListeners(Infinity)

    if (typeof prop === 'string' && value !== undefined) {
      Object.assign(this, { prop, value })
    }
  }

  /**
   * Get current property
   * @returns {string}
   */
  get prop() {
    return this._prop
  }

  /**
   * Set property
   * @param {string} val
   * @fires Param#change:prop
   * @fires List#change
   * #fires List#change:prop
   */
  set prop(val) {
    if (typeof val !== 'string') {
      throw new Error('Property needs to be a string')
    }

    const evt = {
      prevModel: this.toObject(),
      model: { [val]: this.value },
      changed: {
        from: this._prop,
        to: val
      }
    }

    // update property
    this._prop = val

    /**
     * Param event.
     *
     * @event Param#change:prop
     * @type {string} new property
     * @type {object}
     * @property {object} prevModel - param before change
     * @property {object} model - param after change
     * @property {object} changed - {from, to}
     */
    this.emit('change:prop', val, evt)

    if (this._list) {
      /**
       * List event.
       *
       * @event List#change
       * @type {object}
       * @property {object} prevModel - param before change
       * @property {object} model - param after change
       * @property {object} changed - {from, to}
       */
      this._list.emit('change', evt)

      /**
       * List event.
       *
       * @event List#change:prop
       * @type {string} new property
       * @type {object}
       * @property {object} prevModel - param before change
       * @property {object} model - param after change
       * @property {object} changed - {from, to}
       */
      this._list.emit('change:prop', val, evt)
    }
  }

  /**
   * Get current value.
   * @returns {*}
   */
  get value() {
    if (this.isEval()) {
      // create available mappings for current value
      const mappings = this.mappings.reduce((result, mapping) => {
        if (mapping.regex.global) {
          mapping.regex.lastIndex = 0
        }

        if (mapping.regex.test(this._value)) {
          result[mapping.regex] = mapping
        }

        return result
      }, {})

      // apply mappings
      let val = this._value

      for (let mapping in mappings) {
        val = val.replace(mappings[mapping].regex, `mappings[${mapping}].map`)
      }
      return eval(val) // eslint-disable-line no-eval
    }

    return this._value
  }

  /**
   * Set current value
   * @param {*} val
   * @fires Param#change:value
   * @fires List#change
   * @fires List#change:value
   */
  set value(val) {
    const evt = {
      prevModel: this.toObject(),
      model: { [this.prop]: val },
      changed: {
        from: this._value,
        to: val
      }
    }

    // set value
    this._value = val

    /**
     * Param event.
     *
     * @event Param#change:value
     * @type {*} new value
     * @type {object}
     * @property {object} prevModel - param before change
     * @property {object} model - param after change
     * @property {object} changed - {from, to}
     */
    this.emit('change:value', val, evt)

    if (this._list) {
      /**
       * List event.
       *
       * @event List#change
       * @type {object}
       * @property {object} prevModel - param before change
       * @property {object} model - param after change
       * @property {object} changed - {from, to}
       */
      this._list.emit('change', evt)

      /**
       * List event.
       *
       * @event List#change:value
       * @type {*} new value
       * @type {object}
       * @property {object} prevModel - param before change
       * @property {object} model - param after change
       * @property {object} changed - {from, to}
       */
      this._list.emit('change:value', val, evt)
    }
  }

  /**
   * Get the list where this param is attached to
   * @returns {List}
   */
  get list() {
    return this._list
  }

  /**
   * Export param to a plain object
   * @returns {object}
   */
  toObject() {
    return { [this.prop]: this.value }
  }

  /**
   * Check if this param is a CSS Transform
   * @returns {boolean}
   */
  isCSSTransform() {
    return [
      'x', 'y', 'z',
      'rotateX', 'rotateY', 'rotateZ',
      'skewX', 'skewY',
      'scale', 'scaleX', 'scaleY'
    ].includes(this.prop)
  }

  /**
   * Check if current param has an evaluable value
   * @returns {boolean}
   */
  isEval() {
    return /\{(.*?)}/.test(this._value)
  }
}

/**
 * Parse Param from object
 * @param {object} obj "{prop: value}"
 * @example {x: 120}
 * @returns {Param}
 */
Param.fromObject = function(obj) {
  if (!obj || typeof obj !== 'object' || obj instanceof Array) {
    throw new Error('Object is invalid.')
  }

  const keys = Object.keys(obj)

  if (keys.length === 0 || keys.length > 1) {
    throw new Error('Object is invalid')
  }

  const prop = keys[0]
  const value = obj[prop]

  if (value === null || value === undefined) {
    throw new Error('Object is invalid')
  }

  return new Param(prop, value)
}

export default Param
