<script>
  import { link, router } from './route'

  export let to;
  export let params;
  export let path;
  export let query;
  
  export let attrs;
  export let data;
 
  export const htmlAttrs = attrs === undefined ? {} : attrs
  export const dataAttrs = data === undefined ? {} : toDataAttrs(data)   

  function toDataAttrs(data) {
    return Object.keys(data).reduce((acc, key) => {
      acc[`data-${key}`] = data[key];
      return acc;
    }, {});
  }
</script>

<a use:link={{to, params, attrs, path, query}} href='#/' {...htmlAttrs} {...dataAttrs}><slot></slot></a> 