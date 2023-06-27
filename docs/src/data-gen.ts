export type Node = {
  id: string;
  totalLinks?: number;
  inputLinks?: number;
  outputLinks?: number;
  color?: string;
};

export type Link = {
  source: string;
  target: string;
};

export function generateData(): Promise<{nodes: Node[], links: Link[]}> {
  return new Promise((resolve, reject) => {
    fetch('data.csv')
      .then((response) => {
        return response.text();
      })
      .then((data) => {
        const array = csvToArray(data);
        const { nodes, links } = generateNodes(array);

        resolve({ nodes, links });
      })
      .catch(e => reject(e));

  });
}

function csvToArray(data: string, delimiter: string = ',',  omitFirstRow: boolean = true): string[][] {
  const result = data.slice(omitFirstRow ? data.indexOf('\n') + 1 : 0)
    .split('\r\n')
    .map(v => v.split(delimiter));

  return result;
}

function generateNodes(arr: string[][]) {
  var nodes: Node[] = [];
  var links: Link[] = [];
  arr.forEach(value => {
    const outputIndex = nodes.findIndex(n => n.id === value[0]);
    if (outputIndex === -1) {
      nodes.push({ id: value[0], totalLinks: 1, inputLinks: 0, outputLinks: 1, color: "#d81b60" });
    } else {
      nodes[outputIndex].totalLinks! += 1;
      nodes[outputIndex].outputLinks! += 1;
    }

    const inputIndex = nodes.findIndex(n => n.id === value[1]);
    if (inputIndex === -1) {
      nodes.push({ id: value[1], totalLinks: 1, inputLinks: 1, outputLinks: 0, color: "#d81b60" });
    } else {
      nodes[inputIndex].totalLinks! += 1;
      nodes[inputIndex].inputLinks! += 1;
    }

    links.push({ source: value[0], target: value[1] });
  });

  const maxCount = Math.max(...nodes.map((n) => n.totalLinks!));
  nodes = nodes.map((n) => ({
    ...n,
    color: getColor(parseFloat((n.totalLinks! / maxCount).toFixed(2)))
  }));

  return { nodes, links };
}

function getColor(ratio: number = 0): string {
  var color1 = 'd81b60';
  var color2 = '4F74C2';
  var hex = function(x: number): string {
      const y = x.toString(16);
      return (y.length == 1) ? '0' + y : y;
  };

  var r = Math.ceil(parseInt(color1.substring(0,2), 16) * ratio + parseInt(color2.substring(0,2), 16) * (1-ratio));
  var g = Math.ceil(parseInt(color1.substring(2,4), 16) * ratio + parseInt(color2.substring(2,4), 16) * (1-ratio));
  var b = Math.ceil(parseInt(color1.substring(4,6), 16) * ratio + parseInt(color2.substring(4,6), 16) * (1-ratio));

  var nodeColor = "#" + hex(r) + hex(g) + hex(b);
  return nodeColor;
}
