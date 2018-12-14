var dashGrid = function (el) {
    this.grid = $(el);
    this.cols = 3
    this.rows = parseInt(Math.ceil(this.gridItem().length / this.cols));
    this.nodes = {};
    this.item = {
        width: (100 / this.cols),
        height: 200
    };

    this.hintNodes();
    this.mapItems();
};

dashGrid.prototype.hintNodes = function (row) {
    var last = (typeof row !== "undefined") ? row : this.rows;

    for (r = 0; r < (last + 1); r++) {
        for (c = 0; c < this.cols; c++) {
            var top = this.item.height * r;
            var left = this.item.width * c;

            this.nodes[r + "," + c ] = {"top": top + "px", "left": left + "%", "width": this.item.width + "%", "height": this.item.height + "px"}
        }
    }

    this.rows = last;

    return this.nodes;
};

dashGrid.prototype.gridItem = function (attr) {
    return $("#" + this.grid.get(0).id + " > .dash-grid-item" + (typeof attr !== "undefined" ? attr : ""));
};

dashGrid.prototype.gridHint = function (attr) {
    return $("#" + this.grid.get(0).id + " > .dash-grid-hint" + (typeof attr !== "undefined" ? attr : ""));
};

dashGrid.prototype.mapItems = function () {
    var self = this;
    var exist = [], start_row = 0, start_col = 0;

    this.gridItem().each(function (i, e) {
        var data = self.getData(e);

        if (typeof data.row === "undefined" || typeof data.col === "undefined") {
            exist.push(data.id);
        } else {
            self.gridItem("[data-id='" + data.id + "']").css(self.nodes[data.row + "," + data.col]);
            start_row = data.row;
            start_col = data.col;
        }
    });

    var i = 0;

    for (r = 0; r < this.rows; r++) {
        for (c = 0; c < this.cols; c++) {
            if (typeof exist[i] !== "undefined") {
                if (typeof this.gridItem("[data-row='" + r + "'][data-col='" + c + "']").get(0) === "undefined") {
                    this.gridItem("[data-id='" + exist[i] + "']").attr("data-row", r).attr("data-col", c).css(this.nodes[r + "," + c ]);
                    i++;
                }
            }
        }
    }

    this.grid.css({"position": "relative", "height": (this.item.height * (this.rows + 1)) + "px"});
    this.grid.append('<div class="dash-grid-hint"></div>');
};

dashGrid.prototype.resizeItem = function (el) {
    var style = this.getStyles(el);
    var attr = this.getAttributes(el);
    var mode = (typeof attr["data-mode"] !== "undefined") ? attr["data-mode"] : "min";

    if (mode == "min") {
        mode = "max";
        style.width = (parseInt(style.width) * 2) + "%";
        style.height = (parseInt(style.height) * 2) + "px";

        if (parseInt(attr["data-col"]) == (this.cols - 1)) {
            $(el).attr("data-col", (this.cols - 2));
            $(el).attr("data-x-col", (this.cols - 1));

            style.left = this.item.width * (this.cols - 2) + "%";
        }
    } else {
        mode = "min";
        style.width = (parseInt(style.width) / 2) + "%";
        style.height = (parseInt(style.height) / 2) + "px";

        if (typeof attr["data-x-col"] !== "undefined") {
            $(el).attr("data-col", $(el).attr("data-x-col"));
            $(el).removeAttr("data-x-col");

            style.left = this.item.width * (this.cols - 1) + "%";
        }
    }

    $(el).attr("data-mode", mode).css(style);
};

dashGrid.prototype.getData = function (el) {
    var data = {};

    if (typeof el !== "undefined") {
        data = $(el).data();
    }

    return data;
};

dashGrid.prototype.getStyles = function (el) {
    var css = {};

    if (typeof el !== "undefined") {
        $.each($(el).attr("style").split(";"), function (key, value) {
            if (value.trim() != "") {
                var p = value.trim().split(":")[0].trim();
                var v = value.trim().split(":")[1].trim();

                css[p] = v;
            }
        });
    }

    return css;
};

dashGrid.prototype.getAttributes = function (el) {
    var attr = {};

    if (typeof el !== "undefined") {
        $.each($(el)[0].attributes, function (index, attribute) {
            attr[attribute.name] = attribute.value;
        });
    }

    return attr;
}

dashGrid.prototype.draggable = function () {
    var self = this;

    this.grid.kendoDraggable({
        filter: ".dash-grid-item",
        hint: function (element) {
            var w = $(element).width();
            var h = $(element).height();

            return element.clone().addClass("drag").css({"width": w, "height": h});
        },
        drag: function (e) {
            var drag = $(".dash-grid-item.drag").get(0);
            var dragData = self.getData(drag);
            var dragStyles = self.getStyles(drag);
            var dragY = (parseInt(dragStyles.top) - self.grid.offset().top) + e.offsetY;
            var dragX = (parseInt(dragStyles.left) - self.grid.offset().left) + e.offsetX;
            var dragTop = parseInt(dragY);
            var dragLeft = parseInt((dragX / self.grid.width()) * 100);

            $.each(self.nodes, function (key, node) {
                if ((parseInt(dragTop) >= parseInt(node.top) && parseInt(dragTop) <= (parseInt(node.top) + parseInt(node.height)))) {
                    if ((parseInt(dragLeft) >= parseInt(node.left) && parseInt(dragLeft) <= (parseInt(node.left) + parseInt(node.width)))) {
                        var r = parseInt(key.split(",")[0]);
                        var c = parseInt(key.split(",")[1]);

                        self.gridHint().attr("data-row", r).attr("data-col", c).css(node);
                    }
                }
            });
        },
        dragend: function (e) {
            var hint = self.gridHint().get(0);
            var hintAttr = self.getAttributes(hint);
            var hintStyles = self.getStyles(hint);
            var hintRow = parseInt(hintAttr["data-row"]);
            var hintCol = parseInt(hintAttr["data-col"]);
            var hintMode = hintAttr["data-mode"];

            var drag = e.currentTarget.get(0);
            var dragAttr = self.getAttributes(drag);
            var dragStyles = self.getStyles(drag);
            var dragRow = parseInt(dragAttr["data-row"]);
            var dragCol = parseInt(dragAttr["data-col"]);
            var dragMode = dragAttr["data-mode"];

            var drop = self.gridItem("[data-row='" + hintRow + "'][data-col='" + hintCol + "']").get(0);
            var dropAttr = self.getAttributes(drop);
            var dropStyles = self.getStyles(drop);
            var dropRow = parseInt(dropAttr["data-row"]);
            var dropCol = parseInt(dropAttr["data-col"]);
            var dropMode = dropAttr["data-mode"];

            if (typeof drop !== "undefined") {
                $(drop).attr("data-row", dragRow).attr("data-col", dragCol).css(dragStyles);
            }

            $(drag).attr("data-row", hintRow).attr("data-col", hintCol).css(hintStyles);

            if (hintRow === self.rows) {
                self.hintNodes(hintRow + 1);
                self.grid.css({"position": "relative", "height": (self.item.height * (self.rows + 1)) + "px"});
            }

            self.gridHint().removeAttr("style");
            $(".dash-grid-item.drag").hide();
        }
    });

    this.grid.on("click", ".resize", function (e) {
        var el = $(e.currentTarget).parent().get(0);

        self.resizeItem(el);
    });
};